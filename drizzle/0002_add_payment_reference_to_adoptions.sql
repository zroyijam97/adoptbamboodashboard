-- Migration: Add payment_reference_no to adoptions table
-- This field will help prevent duplicate adoptions for the same payment

ALTER TABLE "adoptions" ADD COLUMN "payment_reference_no" text;
ALTER TABLE "adoptions" ADD CONSTRAINT "adoptions_payment_reference_no_unique" UNIQUE("payment_reference_no");