import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * Generate PDF from HTML element with optimized file size
 * @param elementId - ID of the HTML element to convert to PDF
 * @param filename - Name of the PDF file to download
 */
export async function generatePDF(elementId: string, filename: string, options: { format?: 'a4' | 'thermal' | 'compact', width?: number } = {}): Promise<void> {
    const element = document.getElementById(elementId)

    if (!element) {
        console.error(`Element with ID "${elementId}" not found`)
        return
    }

    try {
        // Temporarily show the element for capturing
        const originalDisplay = element.style.display
        const originalVisibility = element.style.visibility
        const originalPosition = element.style.position

        element.style.display = 'block'
        element.style.visibility = 'visible'
        // Ensure static position for accurate capture if needed, though fixed works for print. 
        // For HTML2Canvas, standard positioning is usually safer.
        // We'll leave position as is since we fixed it for print, but html2canvas might need it visible on screen.

        // Wait a bit for rendering
        await new Promise(resolve => setTimeout(resolve, 100))

        // Capture the element as canvas with high quality settings
        const canvas = await html2canvas(element, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            removeContainer: true,
            imageTimeout: 0,
            allowTaint: false,
            foreignObjectRendering: false,
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight
        })

        // Restore original display
        element.style.display = originalDisplay
        element.style.visibility = originalVisibility

        const isThermal = options.format === 'thermal' || filename.toLowerCase().includes('thermal')

        let pdfFormat: any = 'a4'
        let imgWidth = 210 // A4 width in mm

        if (isThermal) {
            imgWidth = 58 // Thermal width in mm
            // Calculate height maintaining aspect ratio
            const imgHeight = (canvas.height * imgWidth) / canvas.width
            // For thermal, we typically want one long page
            pdfFormat = [imgWidth, imgHeight]
        } else if (options.format === 'compact') {
            imgWidth = 215.9 // F4 Width? Or based on compact
            // Compact is 1/3 F4 usually, but let's stick to standard width
            pdfFormat = 'legal' // or custom
        }

        const pageHeight = isThermal ? 999999 : 297 // Infinite height for calculation logic if thermal

        const imgHeight = (canvas.height * imgWidth) / canvas.width

        // Create PDF with compression enabled
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: isThermal ? [imgWidth, imgHeight] : 'a4', // Use calculated size for thermal
            compress: true
        })

        // Convert to PNG for better quality (no compression artifacts)
        const imgData = canvas.toDataURL('image/png')

        let heightLeft = imgHeight
        let position = 0

        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)

        if (!isThermal) {
            heightLeft -= pageHeight
            // Add additional pages if content is longer than one page (only for paginated formats)
            while (heightLeft > 0) {
                position = heightLeft - imgHeight
                pdf.addPage()
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
                heightLeft -= pageHeight
            }
        }

        // Download the PDF
        pdf.save(filename)
    } catch (error) {
        console.error('Error generating PDF:', error)
        throw error
    }
}


/**
 * Generate filename for customer bill
 */
export function generateBillFilename(customerName: string): string {
    const date = new Date()
    const month = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
    const sanitizedName = customerName.replace(/[^a-zA-Z0-9]/g, '_')
    return `Tagihan_${sanitizedName}_${month}.pdf`
}
