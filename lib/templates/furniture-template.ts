/**
 * Mobilya Üretim Template
 * 
 * Mobilya sektörü için hazır Odoo konfigürasyon template'i
 */

import type {
  TemplateModule,
  TemplateConfiguration,
  TemplateWorkflow,
  TemplateCustomField,
  TemplateReport,
} from '@/lib/services/template-service'

export const furnitureTemplate = {
  name: 'Mobilya Üretim Template',
  description: 'Mobilya üretim firmaları için hazır Odoo konfigürasyonu. Sales, MRP, Inventory ve PLM modüllerini içerir.',
  industry: 'furniture',
  modules: [
    {
      name: 'Sales',
      technical_name: 'sale',
      category: 'Sales',
      config: {
        auto_confirm: true,
        auto_done_setting: true,
      },
    },
    {
      name: 'MRP (Manufacturing)',
      technical_name: 'mrp',
      category: 'Manufacturing',
      config: {
        use_manufacturing_lead: true,
        group_mrp_routings: true,
      },
    },
    {
      name: 'Inventory',
      technical_name: 'stock',
      category: 'Inventory',
      config: {
        group_stock_multi_locations: true,
        group_stock_multi_warehouses: true,
      },
    },
    {
      name: 'PLM (Product Lifecycle Management)',
      technical_name: 'mrp_plm',
      category: 'Manufacturing',
      config: {
        enable_engineering_change: true,
      },
    },
    {
      name: 'Quality',
      technical_name: 'quality',
      category: 'Manufacturing',
      config: {
        quality_control: true,
      },
    },
  ] as TemplateModule[],

  configurations: [
    {
      type: 'model' as const,
      name: 'Product Dimensions',
      code: `
# Custom fields for furniture products
from odoo import models, fields

class ProductTemplate(models.Model):
    _inherit = 'product.template'
    
    # Dimensions
    length = fields.Float('Length (cm)', default=0.0)
    width = fields.Float('Width (cm)', default=0.0)
    height = fields.Float('Height (cm)', default=0.0)
    
    # Material
    material_type = fields.Selection([
        ('wood', 'Wood'),
        ('metal', 'Metal'),
        ('fabric', 'Fabric'),
        ('leather', 'Leather'),
        ('glass', 'Glass'),
    ], string='Material Type')
    
    # Finish
    finish_type = fields.Selection([
        ('lacquer', 'Lacquer'),
        ('varnish', 'Varnish'),
        ('paint', 'Paint'),
        ('natural', 'Natural'),
    ], string='Finish Type')
    
    # Production time
    production_time = fields.Float('Production Time (days)', default=1.0)
      `,
      settings: {
        model: 'product.template',
        fields: ['length', 'width', 'height', 'material_type', 'finish_type', 'production_time'],
      },
    },
  ] as TemplateConfiguration[],

  workflows: [
    {
      name: 'Order Approval Process',
      steps: [
        {
          name: 'Order Received',
          action: 'create_sale_order',
        },
        {
          name: 'Manager Approval',
          action: 'approve_order',
          conditions: {
            amount: '> 10000',
          },
        },
        {
          name: 'Production Planning',
          action: 'create_mrp_order',
        },
      ],
    },
    {
      name: 'Production Planning',
      steps: [
        {
          name: 'Material Check',
          action: 'check_material_availability',
        },
        {
          name: 'Production Order',
          action: 'create_production_order',
        },
        {
          name: 'Quality Control',
          action: 'quality_check',
        },
      ],
    },
  ] as TemplateWorkflow[],

  custom_fields: [
    {
      model: 'product.template',
      field_name: 'length',
      field_type: 'float',
      options: {
        string: 'Length (cm)',
        default: 0.0,
      },
    },
    {
      model: 'product.template',
      field_name: 'width',
      field_type: 'float',
      options: {
        string: 'Width (cm)',
        default: 0.0,
      },
    },
    {
      model: 'product.template',
      field_name: 'height',
      field_type: 'float',
      options: {
        string: 'Height (cm)',
        default: 0.0,
      },
    },
    {
      model: 'product.template',
      field_name: 'material_type',
      field_type: 'selection',
      options: {
        string: 'Material Type',
        selection: [
          ['wood', 'Wood'],
          ['metal', 'Metal'],
          ['fabric', 'Fabric'],
          ['leather', 'Leather'],
          ['glass', 'Glass'],
        ],
      },
    },
    {
      model: 'product.template',
      field_name: 'finish_type',
      field_type: 'selection',
      options: {
        string: 'Finish Type',
        selection: [
          ['lacquer', 'Lacquer'],
          ['varnish', 'Varnish'],
          ['paint', 'Paint'],
          ['natural', 'Natural'],
        ],
      },
    },
    {
      model: 'product.template',
      field_name: 'production_time',
      field_type: 'float',
      options: {
        string: 'Production Time (days)',
        default: 1.0,
      },
    },
  ] as TemplateCustomField[],

  reports: [
    {
      name: 'Order Form',
      template: 'sale.report_saleorder_document',
      format: 'pdf',
    },
    {
      name: 'Production Order',
      template: 'mrp.report_mrp_production_order',
      format: 'pdf',
    },
    {
      name: 'Shipping Document',
      template: 'stock.report_delivery_document',
      format: 'pdf',
    },
  ] as TemplateReport[],
}




