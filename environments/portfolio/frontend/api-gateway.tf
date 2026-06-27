# ─────────────────────────────────────────────────────────
# API Gateway
# ─────────────────────────────────────────────────────────

resource "aws_apigatewayv2_api" "status_api" {
  name          = "cl-portfolio-status-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["https://${var.domain_name}", "https://${var.www_domain_name}"]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["content-type"]
    max_age       = 300
  }
}

resource "aws_apigatewayv2_integration" "status_lambda" {
  api_id                 = aws_apigatewayv2_api.status_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.status_checker.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "status_get" {
  api_id    = aws_apigatewayv2_api.status_api.id
  route_key = "GET /api/status"
  target    = "integrations/${aws_apigatewayv2_integration.status_lambda.id}"
}

resource "aws_apigatewayv2_route" "resources_get" {
  api_id    = aws_apigatewayv2_api.status_api.id
  route_key = "GET /api/resources"
  target    = "integrations/${aws_apigatewayv2_integration.status_lambda.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.status_api.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.status_api_access_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip              = "$context.identity.sourceIp"
      requestTime     = "$context.requestTime"
      httpMethod      = "$context.httpMethod"
      routeKey        = "$context.routeKey"
      status          = "$context.status"
      responseLength  = "$context.responseLength"
      integrationErr  = "$context.integrationErrorMessage"
    })
  }
}

resource "aws_cloudwatch_log_group" "status_api_access_logs" {
  name              = "/aws/apigateway/cl-portfolio-status-api"
  retention_in_days = var.lambda_log_retention_days
}

resource "aws_lambda_permission" "apigw_invoke_status_checker" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.status_checker.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.status_api.execution_arn}/*/*"
}
