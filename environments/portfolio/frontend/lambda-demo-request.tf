# ---------------------------------------------------------------------------
# Demo request Lambda — POST /api/demo-request
# Colocated in the frontend layer — shares aws_apigatewayv2_api.status_api
#
# Deliberately separate from status_checker: that role carries broad read
# access (EKS, EC2, ELB, ASG, CloudFront, CodeBuild, S3, Cost Explorer). This
# is an unauthenticated public write path that calls SES, so it gets its own
# role with logs + one SES action and nothing else.
# ---------------------------------------------------------------------------

locals {
  demo_request_function_name = "${var.project_name}-demo-request"
}

# ---------------------------------------------------------------------------
# IAM — demo request Lambda execution role
# ---------------------------------------------------------------------------
data "aws_iam_policy_document" "demo_request_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "demo_request" {
  name               = "${local.demo_request_function_name}-role"
  assume_role_policy = data.aws_iam_policy_document.demo_request_assume.json
  tags               = local.chat_tags
}

resource "aws_iam_role_policy_attachment" "demo_request_basic" {
  role       = aws_iam_role.demo_request.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "demo_request_policy" {
  statement {
    sid     = "SendDemoRequestMail"
    actions = ["ses:SendEmail"]
    resources = [
      aws_sesv2_email_identity.demo_notify.arn,
      aws_sesv2_configuration_set.demo.arn,
    ]

    # Belt and braces: this role can only ever mail you, even if a bug in the
    # handler lets a caller influence the recipient.
    condition {
      test     = "ForAllValues:StringEquals"
      variable = "ses:Recipients"
      values   = [var.demo_notify_email]
    }
  }
}

resource "aws_iam_role_policy" "demo_request_policy" {
  name   = "${local.demo_request_function_name}-policy"
  role   = aws_iam_role.demo_request.id
  policy = data.aws_iam_policy_document.demo_request_policy.json
}

# ---------------------------------------------------------------------------
# Lambda deployment package
# archive_file is safe here, unlike the chat Lambda: this is a single file
# with no third-party dependencies (boto3 ships in the runtime), so there are
# no vendored wheels for the system Python to get wrong. Nothing to `make build`.
# ---------------------------------------------------------------------------
data "archive_file" "demo_request" {
  type        = "zip"
  source_file = "${path.module}/lambda/demo_request/demo_request.py"
  output_path = "${path.module}/lambda/demo_request.zip"
}

resource "aws_lambda_function" "demo_request" {
  function_name    = local.demo_request_function_name
  role             = aws_iam_role.demo_request.arn
  handler          = "demo_request.handler"
  runtime          = "python3.13"
  filename         = data.archive_file.demo_request.output_path
  source_code_hash = data.archive_file.demo_request.output_base64sha256
  timeout          = 10
  memory_size      = 128

  environment {
    variables = {
      SES_FROM_ADDRESS      = var.demo_notify_email
      DEMO_NOTIFY_EMAIL     = var.demo_notify_email
      SES_CONFIGURATION_SET = aws_sesv2_configuration_set.demo.configuration_set_name
    }
  }

  tags = local.chat_tags
}

resource "aws_cloudwatch_log_group" "demo_request" {
  name              = "/aws/lambda/${local.demo_request_function_name}"
  retention_in_days = var.lambda_log_retention_days
  tags              = local.chat_tags
}

# ---------------------------------------------------------------------------
# API Gateway — attach to the existing HTTP API in this layer
# POST /api/demo-request
#
# No OPTIONS route: /api/* is same-origin through CloudFront, so the browser
# never sends a preflight. (Same is true of POST /api/chat — see notes.)
# ---------------------------------------------------------------------------
resource "aws_apigatewayv2_integration" "demo_request" {
  api_id                 = aws_apigatewayv2_api.status_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.demo_request.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "demo_request_post" {
  api_id    = aws_apigatewayv2_api.status_api.id
  route_key = "POST /api/demo-request"
  target    = "integrations/${aws_apigatewayv2_integration.demo_request.id}"
}

resource "aws_lambda_permission" "demo_request_apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.demo_request.function_name
  principal     = "apigateway.amazonaws.com"
  # Path-scoped, matching the chat Lambda pattern rather than the looser
  # /*/* used by status_checker.
  source_arn = "${aws_apigatewayv2_api.status_api.execution_arn}/*/*/api/demo-request"
}

output "demo_request_lambda_name" {
  description = "Demo request Lambda function name — for log tailing"
  value       = aws_lambda_function.demo_request.function_name
}

###############################################################################
# Throttling — replace aws_apigatewayv2_stage.default in api-gateway.tf
#
# HTTP APIs have no usage plans or API keys (REST v1 only), so stage and route
# settings are the entire toolbox. Without these every route inherits the
# account default of 10,000 req/s — on endpoints that call Anthropic and SES.
###############################################################################
#
 resource "aws_apigatewayv2_stage" "default" {
   api_id      = aws_apigatewayv2_api.status_api.id
   name        = "$default"
   auto_deploy = true

   # Applies to any route without an override below. Sized for the read
   # endpoints, which the frontend polls once a minute per visitor.
   default_route_settings {
     throttling_rate_limit    = 20
     throttling_burst_limit   = 40
     detailed_metrics_enabled = true
   }

   # Costs real money per call. The DynamoDB daily cap protects the budget
   # over a day; this protects it over a second.
   route_settings {
     route_key              = "POST /api/chat"
     throttling_rate_limit  = 2
     throttling_burst_limit = 5
   }

   # A human filling in a form needs exactly one request.
   route_settings {
     route_key              = "POST /api/demo-request"
     throttling_rate_limit  = 1
     throttling_burst_limit = 3
   }

   access_log_settings {
     destination_arn = aws_cloudwatch_log_group.status_api_access_logs.arn
     format = jsonencode({
       requestId      = "$context.requestId"
       ip             = "$context.identity.sourceIp"
       # sourceIp above is the CloudFront edge, not the visitor. CloudFront
       # appends the real client for you.
       clientIp       = "$context.request.header.x-forwarded-for"
       requestTime    = "$context.requestTime"
       httpMethod     = "$context.httpMethod"
       routeKey       = "$context.routeKey"
       status         = "$context.status"
       responseLength = "$context.responseLength"
       integrationErr = "$context.integrationErrorMessage"
     })
   }
 }
