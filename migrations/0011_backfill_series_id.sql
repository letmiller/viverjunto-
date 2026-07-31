UPDATE transactions SET series_id = id WHERE recurrence IS NOT NULL AND recurrence != '' AND series_id IS NULL;
