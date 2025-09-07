# Supabase Schema Update Instructions

## Important: Database Schema Update Required

The Risk Monitoring functionality requires additional columns in the `deliveries` table that need to be added to your Supabase database.

## Steps to Execute:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Navigate to your project: `gekizwnlxdywcfebycao`

2. **Access SQL Editor**
   - In the left sidebar, click on "SQL Editor"
   - Click on "New query" to create a new SQL script

3. **Execute the Schema Update**
   - Copy the contents of the file `update-deliveries-table.sql` 
   - Paste it into the SQL Editor
   - Click "Run" to execute the script

## What the Script Does:

The script adds three new columns to the `deliveries` table:
- `risk_level`: TEXT column to store the risk classification
- `risk_score`: INTEGER column to store the numeric risk score (1-25)
- `risk_assessment_date`: TIMESTAMP column to record when the assessment was made

It also creates indexes for better query performance and adds documentation comments.

## Verification:

After running the script, you can verify the changes by running:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'deliveries' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

## Important Notes:

- The script uses `IF NOT EXISTS` clauses, so it's safe to run multiple times
- The application code has already been updated to work with these new fields
- Once the schema is updated, the Risk Monitoring form will work with full functionality
- Deliveries that have been risk-assessed will no longer appear in the assessment form

## After Schema Update:

1. The Risk Monitoring form will be fully functional
2. Risk assessments will be stored in the database
3. Once a delivery is assessed, it cannot be re-assessed
4. Project risk levels will be automatically updated based on delivery assessments

The TypeScript types and database client have already been updated to reflect these schema changes.

## ⚠️ Important: Code Activation Required

After executing the SQL script, you need to **uncomment the actual database code** in the following functions in `src/lib/supabase-data.ts`:

### 1. updateDeliveryRiskAssessment function (around line 1110):
Remove the comments around the real update code and delete the temporary bypass.

### 2. updateProjectRiskAssessment function (around line 1167):
Remove the temporary return statement and uncomment the delivery assessment logic.

### 3. getPendingRiskAssessmentDeliveries function (around line 1270):
Use the version with `.eq('risk_assessed', false)` filter instead of fetching all deliveries.

**These temporary bypasses were necessary to prevent database errors before the schema update.**