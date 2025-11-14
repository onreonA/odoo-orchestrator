import { openai } from '../openai'
import { getDepartmentService } from '@/lib/services/department-service'
import { createClient } from '@/lib/supabase/server'

export interface DepartmentAnalysis {
  departmentId: string
  departmentName: string
  suggestedConfigs: Array<{
    type: 'model' | 'view' | 'workflow' | 'security' | 'report'
    name: string
    description: string
    priority: 'high' | 'medium' | 'low'
    reason: string
  }>
  recommendedModules: string[]
  estimatedComplexity: 'low' | 'medium' | 'high'
}

export interface ConfigurationSuggestion {
  type: 'model' | 'view' | 'workflow' | 'security' | 'report'
  name: string
  description: string
  priority: 'high' | 'medium' | 'low'
  estimatedTime: string
  dependencies: string[]
}

export interface ConfigurationContext {
  companyId: string
  departmentId?: string
  moduleId?: string
  existingConfigurations?: string[]
  requirements?: string[]
}

export interface ConfigurationRequirements {
  description: string
  fields?: Array<{
    name: string
    type: string
    required?: boolean
    default?: any
  }>
  relationships?: Array<{
    model: string
    type: 'many2one' | 'one2many' | 'many2many'
  }>
  constraints?: string[]
  workflows?: string[]
}

export interface GeneratedConfiguration {
  configurationId: string
  type: 'model' | 'view' | 'workflow' | 'security' | 'report'
  name: string
  generatedCode: string
  filePath: string
  dependencies: string[]
  estimatedComplexity: 'low' | 'medium' | 'high'
}

export interface GeneratedCode {
  code: string
  filePath: string
  language: 'python' | 'xml' | 'javascript'
  dependencies: string[]
  imports: string[]
}

export interface ValidationResult {
  isValid: boolean
  errors: Array<{
    line?: number
    message: string
    severity: 'error' | 'warning'
  }>
  warnings: Array<{
    line?: number
    message: string
  }>
}

export interface TestSuite {
  tests: Array<{
    name: string
    type: 'unit' | 'integration' | 'e2e'
    code: string
  }>
  coverage: number
}

/**
 * Configuration Generator Agent - Odoo konfigürasyonları için AI agent
 *
 * Görevleri:
 * 1. Departman yapısını analiz eder
 * 2. Konfigürasyon önerileri yapar
 * 3. Doğal dilden konfigürasyon üretir
 * 4. Odoo kodu üretir (Python/XML)
 * 5. Kod doğrular
 * 6. Test üretir
 */
export class ConfigurationGeneratorAgent {
  private companyId: string

  constructor(companyId: string) {
    this.companyId = companyId
  }

  /**
   * Analyze department structure and suggest configurations
   */
  async analyzeDepartmentStructure(
    companyId: string,
    departments: Array<{ id: string; name: string; technical_name?: string; description?: string }>
  ): Promise<DepartmentAnalysis[]> {
    const supabase = await createClient()

    // Get company info
    const { data: company } = await supabase
      .from('companies')
      .select('name, industry, size')
      .eq('id', companyId)
      .single()

    const analyses: DepartmentAnalysis[] = []

    for (const dept of departments) {
      const prompt = `
Sen bir Odoo ERP konfigürasyon uzmanısın. Aşağıdaki departman bilgilerini analiz et ve Odoo konfigürasyon önerileri yap.

Firma Bilgileri:
- İsim: ${company?.name || 'Bilinmiyor'}
- Sektör: ${company?.industry || 'Bilinmiyor'}
- Büyüklük: ${company?.size || 'Bilinmiyor'}

Departman Bilgileri:
- İsim: ${dept.name}
- Teknik İsim: ${dept.technical_name || 'Yok'}
- Açıklama: ${dept.description || 'Yok'}

Lütfen şu konfigürasyonları öner:
1. Model (Python class) - Yeni model veya mevcut model'e alan ekleme
2. View (XML) - Form, Tree, Kanban, Graph view'ları
3. Workflow - Otomatik aksiyonlar, server actions
4. Security - Record rules, access rights, groups
5. Report - QWeb PDF raporları

Her öneri için:
- Tip (model/view/workflow/security/report)
- İsim
- Açıklama
- Öncelik (high/medium/low)
- Neden gerekli olduğu

JSON formatında döndür:
{
  "suggestedConfigs": [
    {
      "type": "model|view|workflow|security|report",
      "name": "...",
      "description": "...",
      "priority": "high|medium|low",
      "reason": "..."
    }
  ],
  "recommendedModules": ["module1", "module2"],
  "estimatedComplexity": "low|medium|high"
}
      `.trim()

      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content:
                'Sen bir Odoo ERP konfigürasyon uzmanısın. Departman yapılarını analiz edip uygun konfigürasyonlar öneriyorsun. JSON formatında yanıt veriyorsun.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        })

        const result = JSON.parse(response.choices[0].message.content || '{}')

        analyses.push({
          departmentId: dept.id,
          departmentName: dept.name,
          suggestedConfigs: result.suggestedConfigs || [],
          recommendedModules: result.recommendedModules || [],
          estimatedComplexity: result.estimatedComplexity || 'medium',
        })
      } catch (error: any) {
        console.error(`Error analyzing department ${dept.name}:`, error)
        // Return empty analysis on error
        analyses.push({
          departmentId: dept.id,
          departmentName: dept.name,
          suggestedConfigs: [],
          recommendedModules: [],
          estimatedComplexity: 'medium',
        })
      }
    }

    return analyses
  }

  /**
   * Suggest configurations for a department
   */
  async suggestConfigurations(
    companyId: string,
    departmentId: string,
    requirements: string[]
  ): Promise<ConfigurationSuggestion[]> {
    const departmentService = getDepartmentService()
    const department = await departmentService.getDepartmentById(departmentId)

    const prompt = `
Sen bir Odoo ERP konfigürasyon uzmanısın. Aşağıdaki gereksinimleri analiz et ve konfigürasyon önerileri yap.

Departman: ${department.name}
Gereksinimler:
${requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Her gereksinim için uygun konfigürasyonlar öner:
- Tip (model/view/workflow/security/report)
- İsim
- Açıklama
- Öncelik (high/medium/low)
- Tahmini süre
- Bağımlılıklar

JSON formatında döndür:
{
  "suggestions": [
    {
      "type": "model|view|workflow|security|report",
      "name": "...",
      "description": "...",
      "priority": "high|medium|low",
      "estimatedTime": "...",
      "dependencies": ["dep1", "dep2"]
    }
  ]
}
    `.trim()

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content:
              'Sen bir Odoo ERP konfigürasyon uzmanısın. Gereksinimleri analiz edip uygun konfigürasyonlar öneriyorsun. JSON formatında yanıt veriyorsun.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')
      return result.suggestions || []
    } catch (error: any) {
      console.error('Error suggesting configurations:', error)
      return []
    }
  }

  /**
   * Generate configuration from natural language
   */
  async generateFromNaturalLanguage(
    input: string,
    context: ConfigurationContext
  ): Promise<GeneratedConfiguration> {
    const supabase = await createClient()

    // Get context information
    let contextInfo = ''
    if (context.departmentId) {
      const departmentService = getDepartmentService()
      const department = await departmentService.getDepartmentById(context.departmentId)
      contextInfo += `Departman: ${department.name}\n`
    }

    const prompt = `
Sen bir Odoo ERP geliştiricisisin. Aşağıdaki doğal dil açıklamasından Odoo konfigürasyonu üret.

İstek:
${input}

Bağlam:
${contextInfo}

Lütfen şunları üret:
1. Konfigürasyon tipi (model/view/workflow/security/report)
2. İsim
3. Odoo kodu (Python veya XML)
4. Dosya yolu
5. Bağımlılıklar
6. Tahmini karmaşıklık

Odoo kod standartlarına uygun olmalı:
- Python: PEP 8, Odoo ORM kullanımı
- XML: Odoo view syntax, proper inheritance
- Security: Record rules, access rights

JSON formatında döndür:
{
  "type": "model|view|workflow|security|report",
  "name": "...",
  "generatedCode": "...",
  "filePath": "...",
  "dependencies": ["dep1", "dep2"],
  "estimatedComplexity": "low|medium|high"
}
    `.trim()

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content:
              'Sen bir Odoo ERP geliştiricisisin. Doğal dil açıklamalarından Odoo konfigürasyonları üretiyorsun. JSON formatında yanıt veriyorsun.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2, // Lower temperature for more consistent code generation
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')

      // Create configuration record
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Unauthorized')
      }

      const { data: configuration, error } = await supabase
        .from('configurations')
        .insert({
          company_id: context.companyId,
          type: result.type,
          name: result.name,
          natural_language_input: input,
          generated_code: result.generatedCode,
          file_path: result.filePath,
          status: 'draft',
          created_by: user.id,
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create configuration: ${error.message}`)
      }

      return {
        configurationId: configuration.id,
        type: result.type,
        name: result.name,
        generatedCode: result.generatedCode,
        filePath: result.filePath,
        dependencies: result.dependencies || [],
        estimatedComplexity: result.estimatedComplexity || 'medium',
      }
    } catch (error: any) {
      console.error('Error generating configuration:', error)
      throw new Error(`Failed to generate configuration: ${error.message}`)
    }
  }

  /**
   * Generate code for a specific configuration type
   */
  async generateCode(
    configurationType: 'model' | 'view' | 'workflow' | 'security' | 'report',
    requirements: ConfigurationRequirements
  ): Promise<GeneratedCode> {
    const prompt = `
Sen bir Odoo ERP geliştiricisisin. Aşağıdaki gereksinimlerden ${configurationType} tipinde Odoo kodu üret.

Gereksinimler:
${requirements.description}

${requirements.fields ? `Alanlar:\n${requirements.fields.map(f => `- ${f.name} (${f.type})${f.required ? ' [Zorunlu]' : ''}`).join('\n')}` : ''}

${requirements.relationships ? `İlişkiler:\n${requirements.relationships.map(r => `- ${r.model} (${r.type})`).join('\n')}` : ''}

${requirements.constraints ? `Kısıtlamalar:\n${requirements.constraints.map(c => `- ${c}`).join('\n')}` : ''}

${requirements.workflows ? `İş Akışları:\n${requirements.workflows.map(w => `- ${w}`).join('\n')}` : ''}

Lütfen şunları üret:
1. Odoo kodu (Python veya XML)
2. Dosya yolu
3. Dil (python/xml/javascript)
4. Import'lar
5. Bağımlılıklar

Odoo kod standartlarına uygun olmalı.

JSON formatında döndür:
{
  "code": "...",
  "filePath": "...",
  "language": "python|xml|javascript",
  "dependencies": ["dep1", "dep2"],
  "imports": ["import1", "import2"]
}
    `.trim()

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `Sen bir Odoo ERP geliştiricisisin. ${configurationType} tipinde Odoo kodu üretiyorsun. JSON formatında yanıt veriyorsun.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')

      return {
        code: result.code || '',
        filePath: result.filePath || '',
        language: result.language || 'python',
        dependencies: result.dependencies || [],
        imports: result.imports || [],
      }
    } catch (error: any) {
      console.error('Error generating code:', error)
      throw new Error(`Failed to generate code: ${error.message}`)
    }
  }

  /**
   * Validate generated code
   */
  async validateCode(code: string, type: string): Promise<ValidationResult> {
    const prompt = `
Sen bir Odoo ERP kod doğrulayıcısısın. Aşağıdaki ${type} kodunu doğrula.

Kod:
\`\`\`${type === 'model' ? 'python' : 'xml'}
${code}
\`\`\`

Kontrol et:
1. Syntax hataları
2. Odoo standartlarına uygunluk
3. Eksik import'lar
4. Hatalı field tanımları
5. View syntax hataları (XML için)

JSON formatında döndür:
{
  "isValid": true|false,
  "errors": [
    {
      "line": 10,
      "message": "...",
      "severity": "error|warning"
    }
  ],
  "warnings": [
    {
      "line": 5,
      "message": "..."
    }
  ]
}
    `.trim()

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content:
              'Sen bir Odoo ERP kod doğrulayıcısısın. Kodları analiz edip hataları ve uyarıları buluyorsun. JSON formatında yanıt veriyorsun.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1, // Very low temperature for validation
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')

      return {
        isValid: result.isValid !== false,
        errors: result.errors || [],
        warnings: result.warnings || [],
      }
    } catch (error: any) {
      console.error('Error validating code:', error)
      return {
        isValid: false,
        errors: [{ message: `Validation failed: ${error.message}`, severity: 'error' }],
        warnings: [],
      }
    }
  }

  /**
   * Generate tests for a configuration
   */
  async generateTests(configuration: {
    id: string
    type: string
    name: string
    generated_code: string
  }): Promise<TestSuite> {
    const prompt = `
Sen bir Odoo ERP test uzmanısın. Aşağıdaki konfigürasyon için testler üret.

Konfigürasyon:
- Tip: ${configuration.type}
- İsim: ${configuration.name}
- Kod:
\`\`\`${configuration.type === 'model' ? 'python' : 'xml'}
${configuration.generated_code}
\`\`\`

Lütfen şu testleri üret:
1. Unit testler (her fonksiyon için)
2. Integration testler (model ilişkileri, view render)
3. E2E testler (kullanıcı senaryoları)

Odoo test standartlarına uygun olmalı (unittest.TestCase kullanımı).

JSON formatında döndür:
{
  "tests": [
    {
      "name": "...",
      "type": "unit|integration|e2e",
      "code": "..."
    }
  ],
  "coverage": 85
}
    `.trim()

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content:
              'Sen bir Odoo ERP test uzmanısın. Konfigürasyonlar için testler üretiyorsun. JSON formatında yanıt veriyorsun.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')

      return {
        tests: result.tests || [],
        coverage: result.coverage || 0,
      }
    } catch (error: any) {
      console.error('Error generating tests:', error)
      return {
        tests: [],
        coverage: 0,
      }
    }
  }
}

