# ---------------------------------------------------------------------------
# AI chatbot Lambda + budget DynamoDB
# Colocated in the frontend layer — shares aws_apigatewayv2_api.status_api
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Secrets Manager — Anthropic API key
# Follows the same two-resource pattern as cicd layer secrets.
# Set anthropic_api_key in terraform.tfvars (gitignored).
# ---------------------------------------------------------------------------
resource "aws_secretsmanager_secret" "anthropic_key" {
  name                    = "${var.project_name}/anthropic-api-key"
  description             = "Anthropic API key for the portfolio AI chatbot"
  recovery_window_in_days = 0   # Immediate delete on destroy — no 30-day hold
  tags                    = local.chat_tags
}

resource "aws_secretsmanager_secret_version" "anthropic_key" {
  secret_id     = aws_secretsmanager_secret.anthropic_key.id
  secret_string = var.anthropic_api_key
}

# ---------------------------------------------------------------------------
# DynamoDB — daily token budget counter
# On-demand billing: zero cost when idle (nights/weekends)
# ---------------------------------------------------------------------------
resource "aws_dynamodb_table" "chat_budget" {
  name         = "${var.project_name}-chat-budget"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"

  attribute {
    name = "pk"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = local.chat_tags
}

# ---------------------------------------------------------------------------
# IAM — chat Lambda execution role
# ---------------------------------------------------------------------------
data "aws_iam_policy_document" "chat_lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "chat_lambda" {
  name               = "${local.chat_function_name}-role"
  assume_role_policy = data.aws_iam_policy_document.chat_lambda_assume.json
  tags               = local.chat_tags
}

resource "aws_iam_role_policy_attachment" "chat_lambda_basic" {
  role       = aws_iam_role.chat_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "chat_lambda_policy" {
  statement {
    sid       = "ReadAnthropicSecret"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [aws_secretsmanager_secret.anthropic_key.arn]
  }

  statement {
    sid = "BudgetTableAccess"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:UpdateItem",
    ]
    resources = [aws_dynamodb_table.chat_budget.arn]
  }
}

resource "aws_iam_role_policy" "chat_lambda_policy" {
  name   = "${local.chat_function_name}-policy"
  role   = aws_iam_role.chat_lambda.id
  policy = data.aws_iam_policy_document.chat_lambda_policy.json
}

# ---------------------------------------------------------------------------
# Lambda deployment package
# `make build` installs deps into lambda/chat/package/ before terraform plan.
# archive_file zips the result; source_code_hash triggers redeployment on change.
# ---------------------------------------------------------------------------

# archive_file removed: it rebuilds the zip at plan time using the system Python,
# which may not match the Lambda runtime version. Using a pre-built zip via make build
# ensures the correct Python version and vendored deps are packaged.
# Deploy workflow: make build && make deploy (Lambda code changes)
#                  make build && terraform apply (infrastructure changes)
#data "archive_file" "chat_lambda_zip" {
#  type        = "zip"
#  source_dir  = local.chat_lambda_src
#  output_path = "${path.module}/lambda/chat_lambda.zip"
#  excludes    = ["__pycache__", "*.pyc", ".pytest_cache"]
#}

resource "aws_lambda_function" "chat" {
  function_name    = local.chat_function_name
  role             = aws_iam_role.chat_lambda.arn
  handler          = "handler.handler"
  runtime          = "python3.13"
  filename         = "${path.module}/lambda/chat_lambda.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda/chat_lambda.zip")
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      ANTHROPIC_SECRET_ARN = aws_secretsmanager_secret.anthropic_key.arn
      BUDGET_TABLE_NAME    = aws_dynamodb_table.chat_budget.name
      DAILY_TOKEN_CAP      = tostring(var.chat_daily_token_cap)
      MAX_MESSAGES         = tostring(var.chat_max_messages)
      CLAUDE_MODEL         = var.claude_model
      OTEL_ENDPOINT        = "https://otel.creechlabs.dev"
      OTEL_SECRET_ARN      = ""
    }
  }

  tags = local.chat_tags
}

resource "aws_cloudwatch_log_group" "chat_lambda" {
  name              = "/aws/lambda/${local.chat_function_name}"
  retention_in_days = var.lambda_log_retention_days   # reuses existing variable
  tags              = local.chat_tags
}

# ---------------------------------------------------------------------------
# API Gateway — attach to the existing HTTP API in this layer
# POST /api/chat  — chat requests from the React widget
# OPTIONS /api/chat — CORS preflight (API Gateway handles before Lambda)
# ---------------------------------------------------------------------------
resource "aws_apigatewayv2_integration" "chat" {
  api_id                 = aws_apigatewayv2_api.status_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.chat.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "chat_post" {
  api_id    = aws_apigatewayv2_api.status_api.id
  route_key = "POST /api/chat"
  target    = "integrations/${aws_apigatewayv2_integration.chat.id}"
}

resource "aws_apigatewayv2_route" "chat_options" {
  api_id    = aws_apigatewayv2_api.status_api.id
  route_key = "OPTIONS /api/chat"
  target    = "integrations/${aws_apigatewayv2_integration.chat.id}"
}

resource "aws_lambda_permission" "chat_apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.chat.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.status_api.execution_arn}/*/*/api/chat"
}

# ---------------------------------------------------------------------------
# Outputs
# ---------------------------------------------------------------------------
output "chat_lambda_name" {
  description = "Chat Lambda function name — useful for make deploy and log tailing"
  value       = aws_lambda_function.chat.function_name
}

output "chat_budget_table_name" {
  description = "DynamoDB table name for the daily token budget counter"
  value       = aws_dynamodb_table.chat_budget.name
}
