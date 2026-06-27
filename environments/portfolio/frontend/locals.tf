locals {
  chat_function_name = "${var.project_name}-chat"
  chat_lambda_src    = "${path.module}/lambda/chatbot_handler"
  chat_tags = {
    Project   = var.project_name
    Component = "ai-chatbot"
  }
}