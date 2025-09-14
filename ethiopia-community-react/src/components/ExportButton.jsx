import React, { useState } from 'react'
import { 
  Download, 
  FileText, 
  FileSpreadsheet,
  ChevronDown 
} from 'lucide-react'

const ExportButton = ({ programs, selectedCount = 0 }) => {
  const [isOpen, setIsOpen] = useState(false)

  const formatDateForExport = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return 'N/A'
    }
  }

  const exportToCSV = () => {
    if (!programs || programs.length === 0) {
      console.log('No programs to export')
      return
    }

    const headers = [
      'Program Name',
      'Organization',
      'Location',
      'Subject Area',
      'Grade Level',
      'Duration (weeks)',
      'Cost Category',
      'Cost Amount',
      'Application Deadline',
      'Program Start Date',
      'Program End Date',
      'Prestige Level',
      'Program Type',
      'Delivery Method',
      'Housing Provided',
      'Financial Aid Available',
      'Application URL',
      'Description'
    ]

    const csvContent = [
      headers.join(','),
      ...programs.map(program => [
        `"${(program.program_name || '').replace(/"/g, '""')}"`,
        `"${(program.organization?.name || '').replace(/"/g, '""')}"`,
        `"${(program.location || '').replace(/"/g, '""')}"`,
        `"${(program.subject_area || '').replace(/"/g, '""')}"`,
        program.grade_level || 'N/A',
        program.duration_weeks || 'N/A',
        `"${(program.cost_category || '').replace(/"/g, '""')}"`,
        program.cost_amount || 'N/A',
        formatDateForExport(program.application_deadline),
        formatDateForExport(program.program_start_date),
        formatDateForExport(program.program_end_date),
        `"${(program.prestige_level || '').replace(/"/g, '""')}"`,
        `"${(program.program_type || '').replace(/"/g, '""')}"`,
        `"${(program.delivery_method || '').replace(/"/g, '""')}"`,
        program.housing_provided ? 'Yes' : 'No',
        program.financial_aid ? 'Yes' : 'No',
        `"${(program.application_url || '').replace(/"/g, '""')}"`,
        `"${(program.description || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `ethiopian-programs-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    console.log(`Exported ${programs.length} programs to CSV`)
  }

  const exportToJSON = () => {
    if (!programs || programs.length === 0) {
      console.log('No programs to export')
      return
    }

    const jsonContent = JSON.stringify(programs, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `ethiopian-programs-${new Date().toISOString().split('T')[0]}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    console.log(`Exported ${programs.length} programs to JSON`)
  }

  const printPrograms = () => {
    if (!programs || programs.length === 0) {
      console.log('No programs to print')
      return
    }

    const printWindow = window.open('', '_blank')
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ethiopian & Eritrean Summer Programs</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              line-height: 1.6;
            }
            h1 {
              color: #333;
              text-align: center;
              margin-bottom: 30px;
            }
            .program {
              border: 1px solid #ddd;
              margin-bottom: 20px;
              padding: 15px;
              border-radius: 8px;
              page-break-inside: avoid;
            }
            .program-name {
              font-size: 18px;
              font-weight: bold;
              color: #2c5aa0;
              margin-bottom: 8px;
            }
            .program-org {
              color: #666;
              margin-bottom: 10px;
            }
            .program-details {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 10px;
              margin-top: 10px;
            }
            .detail-item {
              font-size: 14px;
            }
            .detail-label {
              font-weight: bold;
              color: #555;
            }
            @media print {
              body { margin: 0; }
              .program { margin-bottom: 15px; }
            }
          </style>
        </head>
        <body>
          <h1>Ethiopian & Eritrean Summer Programs</h1>
          <p style="text-align: center; color: #666; margin-bottom: 30px;">
            Generated on ${new Date().toLocaleDateString()} - ${programs.length} programs
          </p>
          ${programs.map(program => `
            <div class="program">
              <div class="program-name">${program.program_name || 'Unknown Program'}</div>
              <div class="program-org">${program.organization?.name || 'Unknown Organization'}</div>
              <div class="program-details">
                <div class="detail-item">
                  <span class="detail-label">Location:</span> ${program.location || 'Various'}
                </div>
                <div class="detail-item">
                  <span class="detail-label">Subject:</span> ${program.subject_area || 'N/A'}
                </div>
                <div class="detail-item">
                  <span class="detail-label">Grade Level:</span> ${program.grade_level || 'N/A'}
                </div>
                <div class="detail-item">
                  <span class="detail-label">Duration:</span> ${program.duration_weeks ? `${program.duration_weeks} weeks` : 'N/A'}
                </div>
                <div class="detail-item">
                  <span class="detail-label">Cost:</span> ${program.cost_category || 'N/A'}
                </div>
                <div class="detail-item">
                  <span class="detail-label">Deadline:</span> ${formatDateForExport(program.application_deadline)}
                </div>
                ${program.description ? `
                  <div class="detail-item" style="grid-column: 1 / -1; margin-top: 10px;">
                    <span class="detail-label">Description:</span><br>
                    ${program.description}
                  </div>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </body>
      </html>
    `
    
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
    
    console.log(`Printed ${programs.length} programs`)
  }

  if (!programs || programs.length === 0) {
    return null
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: '#667eea',
          color: 'white',
          border: 'none',
          padding: '12px 20px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s'
        }}
        onMouseOver={(e) => {
          e.target.style.background = '#5a67d8'
          e.target.style.transform = 'translateY(-1px)'
        }}
        onMouseOut={(e) => {
          e.target.style.background = '#667eea'
          e.target.style.transform = 'translateY(0)'
        }}
      >
        <Download size={20} />
        Export ({selectedCount > 0 ? `${selectedCount} selected` : `${programs.length} programs`})
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10
            }}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 20,
            minWidth: '200px',
            marginTop: '4px'
          }}>
            <button
              onClick={() => {
                exportToCSV()
                setIsOpen(false)
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                color: '#374151',
                transition: 'background-color 0.2s',
                borderRadius: '8px 8px 0 0'
              }}
              onMouseOver={(e) => e.target.style.background = '#f8fafc'}
              onMouseOut={(e) => e.target.style.background = 'transparent'}
            >
              <FileSpreadsheet size={16} color="#10b981" />
              Export as CSV
            </button>
            
            <button
              onClick={() => {
                exportToJSON()
                setIsOpen(false)
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                color: '#374151',
                transition: 'background-color 0.2s',
                borderTop: '1px solid #e2e8f0'
              }}
              onMouseOver={(e) => e.target.style.background = '#f8fafc'}
              onMouseOut={(e) => e.target.style.background = 'transparent'}
            >
              <FileText size={16} color="#3b82f6" />
              Export as JSON
            </button>
            
            <button
              onClick={() => {
                printPrograms()
                setIsOpen(false)
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                color: '#374151',
                transition: 'background-color 0.2s',
                borderTop: '1px solid #e2e8f0',
                borderRadius: '0 0 8px 8px'
              }}
              onMouseOver={(e) => e.target.style.background = '#f8fafc'}
              onMouseOut={(e) => e.target.style.background = 'transparent'}
            >
              <FileText size={16} color="#f59e0b" />
              Print Programs
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default ExportButton