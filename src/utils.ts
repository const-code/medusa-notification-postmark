import { Attachment } from "./types"

/**
 * Convert data URLs in HTML to CID attachments
 * Recursively finds all data:image URLs and converts them to CID references
 * 
 * @param html - HTML content with potential data URLs
 * @param existingAttachments - Any existing attachments to preserve
 * @returns Object with modified HTML and all attachments
 */
export function convertDataUrlsToCID(
  html: string,
  existingAttachments: any[] = []
): { html: string; attachments: Attachment[] } {
  const attachments: Attachment[] = [...existingAttachments]
  let finalHtml = html
  let imageCount = 0

  // Find all data URLs in the HTML
  const dataUrlRegex = /data:image\/(png|jpeg|jpg|gif|webp);base64,([A-Za-z0-9+/=]+)/g
  
  let match: RegExpExecArray | null
  while ((match = dataUrlRegex.exec(html)) !== null) {
    const [fullMatch, imageType, base64Content] = match
    const cid = `image-${imageCount++}`
    
    // Create CID attachment
    attachments.push({
      Name: `${cid}.${imageType}`,
      Content: base64Content,
      ContentType: `image/${imageType}`,
      ContentID: `cid:${cid}`,
    })
    
    // Replace data URL with CID reference
    finalHtml = finalHtml.replace(fullMatch, `cid:${cid}`)
  }

  return { html: finalHtml, attachments }
}

/**
 * Convert any object with data URLs to CID attachments
 * Useful for templates that pass images in data object
 * 
 * @param data - Any data object that might contain data URLs
 * @returns Object with modified data and attachments
 */
export function convertObjectDataUrlsToCID(
  data: any
): { data: any; attachments: Attachment[] } {
  const attachments: Attachment[] = []
  let imageCount = 0

  function processValue(value: any): any {
    if (typeof value === 'string' && value.startsWith('data:image')) {
      const match = value.match(/data:image\/(png|jpeg|jpg|gif|webp);base64,([A-Za-z0-9+/=]+)/)
      
      if (match) {
        const [, imageType, base64Content] = match
        const cid = `image-${imageCount++}`
        
        attachments.push({
          Name: `${cid}.${imageType}`,
          Content: base64Content,
          ContentType: `image/${imageType}`,
          ContentID: `cid:${cid}`,
        })
        
        return `cid:${cid}`
      }
    }
    
    if (Array.isArray(value)) {
      return value.map(processValue)
    }
    
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, processValue(v)])
      )
    }
    
    return value
  }

  return {
    data: processValue(data),
    attachments,
  }
}

