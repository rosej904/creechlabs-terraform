output "vpc_id" {
  description = "VPC ID — consumed by EKS layer"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "List of public subnet IDs — used for load balancers"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs — used for EKS nodes"
  value       = aws_subnet.private[*].id
}

output "nat_gateway_ip" {
  description = "Elastic IP of NAT Gateway — useful for whitelisting outbound traffic"
  value       = aws_eip.nat.public_ip
}
