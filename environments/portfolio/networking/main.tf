terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}

# ------------------------------------------------------------
# VPC
# ------------------------------------------------------------
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true  # Required for EKS

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-vpc"
  })
}

# ------------------------------------------------------------
# Internet Gateway
# ------------------------------------------------------------
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-igw"
  })
}

# ------------------------------------------------------------
# Public Subnets (one per AZ)
# ELB/ALB will live here; tagged for AWS Load Balancer Controller
# ------------------------------------------------------------
resource "aws_subnet" "public" {
  count = length(var.availability_zones)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name                                                = "${var.project_name}-public-${var.availability_zones[count.index]}"
    "kubernetes.io/role/elb"                            = "1"
    "kubernetes.io/cluster/${var.project_name}-cluster" = "shared"
  })
}

# ------------------------------------------------------------
# Private Subnets (one per AZ)
# EKS nodes live here; tagged for AWS Load Balancer Controller
# ------------------------------------------------------------
resource "aws_subnet" "private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name                                                = "${var.project_name}-private-${var.availability_zones[count.index]}"
    "kubernetes.io/role/internal-elb"                   = "1"
    "kubernetes.io/cluster/${var.project_name}-cluster" = "shared"
  })
}

# ------------------------------------------------------------
# NAT Gateway — single NAT to keep costs down
# Lives in first public subnet, serves all private subnets
# ------------------------------------------------------------
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-nat-eip"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-nat"
  })

  depends_on = [aws_internet_gateway.main]
}

# ------------------------------------------------------------
# Route Tables
# ------------------------------------------------------------

# Public route table — routes internet traffic via IGW
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-rt"
  })
}

resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private route table — routes internet traffic via NAT
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-rt"
  })
}

resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}
