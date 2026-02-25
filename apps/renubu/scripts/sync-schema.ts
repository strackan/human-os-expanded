#!/usr/bin/env tsx

/**
 * Schema Sync Tool
 * 
 * This script automatically generates TypeScript interfaces from the database schema
 * and validates that all files are using the correct types.
 * 
 * Usage:
 * npm run sync-schema
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface TableInfo {
  table_name: string;
  columns: ColumnInfo[];
}

class SchemaSync {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async getTableSchema(tableName: string): Promise<TableInfo | null> {
    try {
      const { data, error } = await this.supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', tableName)
        .eq('table_schema', 'public');

      if (error) {
        console.error(`Error fetching schema for ${tableName}:`, error);
        return null;
      }

      return {
        table_name: tableName,
        columns: data
      };
    } catch (error) {
      console.error(`Failed to get schema for ${tableName}:`, error);
      return null;
    }
  }

  generateTypeScriptInterface(tableInfo: TableInfo): string {
    const interfaceName = this.pascalCase(tableInfo.table_name);
    let interfaceCode = `export interface ${interfaceName} {\n`;

    for (const column of tableInfo.columns) {
      const tsType = this.mapDatabaseTypeToTypeScript(column.data_type);
      const isOptional = column.is_nullable === 'YES' ? '?' : '';
      
      interfaceCode += `  ${column.column_name}${isOptional}: ${tsType};\n`;
    }

    interfaceCode += '}\n';
    return interfaceCode;
  }

  private mapDatabaseTypeToTypeScript(dbType: string): string {
    const typeMap: Record<string, string> = {
      'uuid': 'string',
      'text': 'string',
      'character varying': 'string',
      'integer': 'number',
      'bigint': 'number',
      'decimal': 'number',
      'numeric': 'number',
      'boolean': 'boolean',
      'timestamp with time zone': 'string',
      'date': 'string',
      'jsonb': 'any',
      'json': 'any'
    };

    return typeMap[dbType.toLowerCase()] || 'any';
  }

  private pascalCase(str: string): string {
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  async syncCustomerTypes(): Promise<void> {
    console.log('🔄 Syncing Customer types...');

    const customerSchema = await this.getTableSchema('customers');
    if (!customerSchema) {
      console.error('❌ Failed to get customer schema');
      return;
    }

    const interfaceCode = this.generateTypeScriptInterface(customerSchema);
    
    // Write to types file
    const typesPath = path.join(process.cwd(), 'src/types/customer.ts');
    const fileContent = `// Auto-generated from database schema
// Last updated: ${new Date().toISOString()}
// 
// To regenerate: npm run sync-schema

${interfaceCode}

// Extended types for specific use cases
export interface CustomerWithProperties extends Customer {
  properties?: CustomerProperties;
}

export interface CustomerWithRenewals extends Customer {
  renewals?: RenewalSummary[];
}

export interface CustomerWithRelations extends Customer {
  properties?: CustomerProperties;
  renewals?: RenewalSummary[];
}

// Related types (manually maintained)
export interface CustomerProperties {
  id?: string;
  customer_id?: string;
  usage_score: number;
  health_score: number;
  nps_score: number;
  current_arr: number;
  expansion_potential: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  revenue_impact_tier: number;
  churn_risk_score: number;
  last_activity_date?: string;
  created_at: string;
  updated_at: string;
}

export interface RenewalSummary {
  id: string;
  renewal_date: string;
  current_arr: number;
  proposed_arr?: number;
  probability: number;
  stage: string;
  risk_level: string;
  days_until_renewal: number;
}

// Form types
export interface CustomerFormData {
  name: string;
  domain: string;
  current_arr?: number;
  renewal_date?: string;
  assigned_to?: string;
}

// Filter types
export interface CustomerFilters {
  risk_level?: string;
  csm_id?: string;
  company_id?: string;
}

// Stats types
export interface CustomerStats {
  total: number;
  byRiskLevel: Record<string, number>;
  totalARR: number;
  atRiskCustomers: number;
}
`;

    fs.writeFileSync(typesPath, fileContent);
    console.log('✅ Customer types synced successfully');
  }

  async validateAllFiles(): Promise<void> {
    console.log('🔍 Validating all files use correct types...');

    const filesToCheck = [
      'src/hooks/useCustomers.ts',
      'src/lib/supabase.ts',
      'src/app/api/customers/route.ts',
      'src/app/customers/manage/page.tsx'
    ];

    for (const file of filesToCheck) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for old field references
        const oldFields = ['industry', 'health_score', 'tier', 'primary_contact_name', 'primary_contact_email', 'primary_contact_phone'];
        const foundOldFields = oldFields.filter(field => content.includes(field));
        
        if (foundOldFields.length > 0) {
          console.warn(`⚠️  ${file} still references old fields: ${foundOldFields.join(', ')}`);
        } else {
          console.log(`✅ ${file} looks good`);
        }
      }
    }
  }
}

async function main() {
  const sync = new SchemaSync();
  
  try {
    await sync.syncCustomerTypes();
    await sync.validateAllFiles();
    console.log('🎉 Schema sync completed!');
  } catch (error) {
    console.error('❌ Schema sync failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 