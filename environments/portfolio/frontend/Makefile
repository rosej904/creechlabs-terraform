# Chat Lambda build + deploy
# Lives at environments/portfolio/frontend/
# Usage:
#   make build    — vendor deps into lambda/chatbot_handler/build/, create zip
#   make deploy   — build + push to Lambda (for local iteration outside CodeBuild)
#   make test     — invoke the deployed function with a sample payload
#   make logs     — tail CloudWatch logs live

FUNCTION_NAME := cl-portfolio-chat
LAMBDA_SRC    := lambda/chatbot_handler
BUILD_DIR     := $(LAMBDA_SRC)/build
ZIP_FILE      := lambda/chat_lambda.zip
REGION        := us-east-1

.PHONY: build clean deploy test logs

build: clean
	mkdir -p $(BUILD_DIR)
	pip install -r $(LAMBDA_SRC)/requirements.txt \
		--target $(BUILD_DIR) \
		--quiet \
		--upgrade
	cp $(LAMBDA_SRC)/handler.py $(BUILD_DIR)/
	cd $(BUILD_DIR) && zip -r ../../chat_lambda.zip . \
		--exclude "*.pyc" \
		--exclude "__pycache__/*" \
		--exclude "*.dist-info/*"
	@echo "✓ Built $(ZIP_FILE) from $(LAMBDA_SRC)"

clean:
	rm -rf $(BUILD_DIR) $(LAMBDA_SRC)/package $(ZIP_FILE)
	@echo "✓ Cleaned build artifacts"

deploy: build
	aws lambda update-function-code \
		--function-name $(FUNCTION_NAME) \
		--zip-file fileb://$(ZIP_FILE) \
		--region $(REGION) \
		--output table
	@echo "✓ Deployed $(FUNCTION_NAME)"

test:
	@echo 'Testing with: "What is creechlabs?"'
	@aws lambda invoke \
		--function-name $(FUNCTION_NAME) \
		--region $(REGION) \
		--cli-binary-format raw-in-base64-out \
		--payload '{"requestContext":{"http":{"method":"POST"}},"body":"{\"messages\":[{\"role\":\"user\",\"content\":\"What is creechlabs?\"}]}"}' \
		/tmp/lambda-response.json 2>/dev/null \
		&& python3 -m json.tool /tmp/lambda-response.json \
		&& rm /tmp/lambda-response.json

logs:
	aws logs tail /aws/lambda/$(FUNCTION_NAME) \
		--follow \
		--format short \
		--region $(REGION)
