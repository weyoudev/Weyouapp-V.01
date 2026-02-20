-- Add SUBSCRIPTION to InvoiceType in a separate migration so it is committed before use (PostgreSQL requirement)
ALTER TYPE "InvoiceType" ADD VALUE 'SUBSCRIPTION';
