# ─────────────────────────────────────────────────────────
# Status checker Lambda
# ─────────────────────────────────────────────────────────

data "archive_file" "status_checker" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/status_checker"
  output_path = "${path.module}/lambda/status_checker.zip"
}

resource "aws_cloudwatch_log_group" "status_checker" {
  name              = "/aws/lambda/cl-portfolio-status-checker"
  retention_in_days = var.lambda_log_retention_days
}

resource "aws_iam_role" "status_checker" {
  name = "cl-portfolio-status-checker"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "status_checker_basic_logs" {
  role       = aws_iam_role.status_checker.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "status_checker_eks_read" {
  name = "eks-describe-cluster-readonly"
  role = aws_iam_role.status_checker.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["eks:DescribeCluster"]
      Resource = "arn:aws:eks:${var.aws_region}:${var.aws_account_id}:cluster/${var.eks_cluster_name}"
    }]
  })
}

resource "aws_lambda_function" "status_checker" {
  function_name = "cl-portfolio-status-checker"
  description   = "Checks EKS cluster + app reachability, returns status for portfolio UI"

  filename         = data.archive_file.status_checker.output_path
  source_code_hash = data.archive_file.status_checker.output_base64sha256

  role    = aws_iam_role.status_checker.arn
  handler = "index.handler"
  runtime = "python3.12"
  timeout = 10
  memory_size = 128

  environment {
    variables = {
      EKS_CLUSTER_NAME    = var.eks_cluster_name
      STATUS_CHECK_TARGETS = jsonencode(var.status_check_targets)
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.status_checker,
    aws_iam_role_policy_attachment.status_checker_basic_logs,
  ]
}
