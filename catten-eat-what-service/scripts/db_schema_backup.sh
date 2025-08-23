CONNECTION_STRING=""

supabase db dump --db-url $CONNECTION_STRING -f roles.sql --role-only
supabase db dump --db-url $CONNECTION_STRING -f schema.sql
supabase db dump --db-url $CONNECTION_STRING -f data.sql --use-copy --data-only
