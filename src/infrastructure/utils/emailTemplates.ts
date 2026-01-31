import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export interface EmailTemplateData {
    subject?: string
    greeting?: string
    mainMessage?: string
    footerText?: string
    footerSignature?: string
}

// Base HTML wrapper - minified to avoid =20 encoding issues
function wrapInEmailTemplate(content: string, footerText: string, footerSignature: string, bgGradient: string = '#fdf4ff 0%,#f0fdf4 100%'): string {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;"><div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:600px;margin:0 auto;background:linear-gradient(135deg,${bgGradient});padding:40px;border-radius:16px;"><div style="text-align:center;margin-bottom:30px;"><h1 style="color:#86198f;margin:0;font-size:28px;">🌸 Ama Nacer</h1><p style="color:#a855f7;margin:5px 0 0 0;font-size:14px;">Psicología</p></div>${content}<div style="text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #e5e7eb;"><p style="color:#9ca3af;font-size:13px;margin:0;">${footerText}<br>${footerSignature}</p></div></div></body></html>`
}

// Confirmation Email
export function generateConfirmationEmail(data: {
    patientName: string
    startTime: Date
    endTime: Date
    appointmentType: 'virtual' | 'in-person'
    template?: EmailTemplateData
}): string {
    const dateStr = format(data.startTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
    const startTimeStr = format(data.startTime, 'h:mm a', { locale: es })
    const endTimeStr = format(data.endTime, 'h:mm a', { locale: es })
    const modalityText = data.appointmentType === 'virtual'
        ? '💻 <strong>Modalidad:</strong> Sesión Virtual (recibirás el enlace antes de la cita)'
        : '🏥 <strong>Modalidad:</strong> Sesión Presencial'

    const greeting = data.template?.greeting || 'Hola'
    const mainMessage = data.template?.mainMessage || 'Tu cita ha sido agendada exitosamente.'
    const footerText = data.template?.footerText || 'Ama Nacer - Psicología'
    const footerSignature = data.template?.footerSignature || 'Desarrollado por Monteslab'

    const content = `<div style="background:white;padding:30px;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.05);"><h2 style="color:#16a34a;margin:0 0 20px 0;font-size:22px;">✅ ¡Tu cita ha sido confirmada!</h2><p style="color:#374151;font-size:16px;line-height:1.6;">${greeting} <strong>${data.patientName}</strong>,</p><p style="color:#374151;font-size:16px;line-height:1.6;">${mainMessage}</p><div style="background:linear-gradient(135deg,#fae8ff 0%,#dcfce7 100%);padding:20px;border-radius:12px;margin:25px 0;border-left:4px solid #a855f7;"><p style="margin:8px 0;color:#374151;font-size:15px;">📅 <strong>Fecha:</strong> ${dateStr}</p><p style="margin:8px 0;color:#374151;font-size:15px;">🕐 <strong>Hora:</strong> ${startTimeStr} - ${endTimeStr}</p><p style="margin:8px 0;color:#374151;font-size:15px;">${modalityText}</p></div><p style="color:#6b7280;font-size:14px;line-height:1.6;">⏰ Si necesitas reprogramar o cancelar tu cita, por favor hazlo con al menos <strong>24 horas de anticipación</strong>.</p></div>`

    return wrapInEmailTemplate(content, footerText, footerSignature)
}

// Cancellation Email
export function generateCancellationEmail(data: {
    patientName: string
    startTime: Date
    reason?: string
    siteUrl?: string
    template?: EmailTemplateData
}): string {
    const dateStr = format(data.startTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
    const timeStr = format(data.startTime, 'h:mm a', { locale: es })
    const reasonHtml = data.reason
        ? `<p style="margin:8px 0;color:#374151;font-size:15px;">📝 <strong>Motivo:</strong> ${data.reason}</p>`
        : ''
    const siteUrl = data.siteUrl || 'https://ama-nacer.com/patient/appointments'

    const greeting = data.template?.greeting || 'Hola'
    const mainMessage = data.template?.mainMessage || 'Te informamos que tu cita ha sido cancelada.'
    const footerText = data.template?.footerText || 'Ama Nacer - Psicología'
    const footerSignature = data.template?.footerSignature || 'Desarrollado por Monteslab'

    const content = `<div style="background:white;padding:30px;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.05);"><h2 style="color:#dc2626;margin:0 0 20px 0;font-size:22px;">❌ Tu cita ha sido cancelada</h2><p style="color:#374151;font-size:16px;line-height:1.6;">${greeting} <strong>${data.patientName}</strong>,</p><p style="color:#374151;font-size:16px;line-height:1.6;">${mainMessage}</p><div style="background:linear-gradient(135deg,#fee2e2 0%,#fae8ff 100%);padding:20px;border-radius:12px;margin:25px 0;border-left:4px solid #ef4444;"><p style="margin:8px 0;color:#374151;font-size:15px;">📅 <strong>Fecha de la cita:</strong> ${dateStr}</p><p style="margin:8px 0;color:#374151;font-size:15px;">🕐 <strong>Hora:</strong> ${timeStr}</p>${reasonHtml}</div><p style="color:#6b7280;font-size:14px;line-height:1.6;">Si deseas reagendar tu cita, puedes hacerlo en cualquier momento desde nuestra plataforma.</p><div style="text-align:center;margin-top:25px;"><a href="${siteUrl}" style="display:inline-block;background:linear-gradient(135deg,#a855f7 0%,#86198f 100%);color:white;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:600;">Reagendar Cita</a></div></div>`

    return wrapInEmailTemplate(content, footerText, footerSignature, '#fef2f2 0%,#fdf4ff 100%')
}

// Reschedule Email
export function generateRescheduleEmail(data: {
    patientName: string
    oldStartTime: Date
    newStartTime: Date
    newEndTime: Date
    appointmentType: 'virtual' | 'in-person'
    template?: EmailTemplateData
}): string {
    const oldDateStr = format(data.oldStartTime, "EEEE, d 'de' MMMM", { locale: es })
    const oldTimeStr = format(data.oldStartTime, 'h:mm a', { locale: es })
    const newDateStr = format(data.newStartTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
    const newStartTimeStr = format(data.newStartTime, 'h:mm a', { locale: es })
    const newEndTimeStr = format(data.newEndTime, 'h:mm a', { locale: es })
    const modalityText = data.appointmentType === 'virtual' ? 'Sesión Virtual' : 'Sesión Presencial'

    const greeting = data.template?.greeting || 'Hola'
    const mainMessage = data.template?.mainMessage || 'Tu cita ha sido reagendada exitosamente.'
    const footerText = data.template?.footerText || 'Ama Nacer - Psicología'
    const footerSignature = data.template?.footerSignature || 'Desarrollado por Monteslab'

    const content = `<div style="background:white;padding:30px;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.05);"><h2 style="color:#2563eb;margin:0 0 20px 0;font-size:22px;">📅 Tu cita ha sido reagendada</h2><p style="color:#374151;font-size:16px;line-height:1.6;">${greeting} <strong>${data.patientName}</strong>,</p><p style="color:#374151;font-size:16px;line-height:1.6;">${mainMessage}</p><div style="background:linear-gradient(135deg,#fef3c7 0%,#dbeafe 100%);padding:20px;border-radius:12px;margin:25px 0;border-left:4px solid #f59e0b;"><p style="margin:8px 0;color:#6b7280;font-size:14px;text-decoration:line-through;">Fecha anterior: ${oldDateStr} a las ${oldTimeStr}</p></div><div style="background:linear-gradient(135deg,#fae8ff 0%,#dcfce7 100%);padding:20px;border-radius:12px;margin:25px 0;border-left:4px solid #16a34a;"><p style="margin:8px 0;color:#374151;font-size:15px;">📅 <strong>Nueva fecha:</strong> ${newDateStr}</p><p style="margin:8px 0;color:#374151;font-size:15px;">🕐 <strong>Nueva hora:</strong> ${newStartTimeStr} - ${newEndTimeStr}</p><p style="margin:8px 0;color:#374151;font-size:15px;">📍 <strong>Modalidad:</strong> ${modalityText}</p></div><p style="color:#6b7280;font-size:14px;line-height:1.6;">⏰ Si necesitas reprogramar nuevamente, por favor hazlo con al menos <strong>24 horas de anticipación</strong>.</p></div>`

    return wrapInEmailTemplate(content, footerText, footerSignature, '#eff6ff 0%,#f0fdf4 100%')
}

// Admin Cancellation Notice (sent to psychologist)
export function generateAdminCancellationNotice(data: {
    patientName: string
    patientEmail: string
    patientPhone?: string
    startTime: Date
    reason?: string
    template?: EmailTemplateData
}): string {
    const dateStr = format(data.startTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
    const timeStr = format(data.startTime, 'h:mm a', { locale: es })
    const reasonHtml = data.reason
        ? `<p style="margin:8px 0;color:#374151;font-size:15px;">📝 <strong>Motivo de cancelación:</strong> ${data.reason}</p>`
        : '<p style="margin:8px 0;color:#6b7280;font-size:14px;font-style:italic;">No se proporcionó motivo de cancelación.</p>'

    const greeting = data.template?.greeting || 'Hola'
    const mainMessage = data.template?.mainMessage || 'Un paciente ha cancelado su cita.'
    const footerText = data.template?.footerText || 'Sistema de Citas - Ama Nacer'
    const footerSignature = data.template?.footerSignature || 'Notificación Automática'

    const content = `<div style="background:white;padding:30px;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.05);"><h2 style="color:#dc2626;margin:0 0 20px 0;font-size:22px;">⚠️ Cancelación de Cita</h2><p style="color:#374151;font-size:16px;line-height:1.6;">${greeting},</p><p style="color:#374151;font-size:16px;line-height:1.6;">${mainMessage}</p><div style="background:linear-gradient(135deg,#fee2e2 0%,#fef3c7 100%);padding:20px;border-radius:12px;margin:25px 0;border-left:4px solid #dc2626;"><p style="margin:12px 0;color:#374151;font-size:15px;"><strong>Datos del Paciente:</strong></p><p style="margin:8px 0;color:#374151;font-size:15px;">👤 <strong>Nombre:</strong> ${data.patientName}</p><p style="margin:8px 0;color:#374151;font-size:15px;">📧 <strong>Email:</strong> ${data.patientEmail}</p><p style="margin:8px 0;color:#374151;font-size:15px;">📱 <strong>Teléfono:</strong> ${data.patientPhone || 'No disponible'}</p><hr style="border:none;border-top:1px solid #fca5a5;margin:15px 0;"><p style="margin:12px 0;color:#374151;font-size:15px;"><strong>Datos de la Cita:</strong></p><p style="margin:8px 0;color:#374151;font-size:15px;">📅 <strong>Fecha:</strong> ${dateStr}</p><p style="margin:8px 0;color:#374151;font-size:15px;">🕐 <strong>Hora:</strong> ${timeStr}</p>${reasonHtml}</div></div>`

    return wrapInEmailTemplate(content, footerText, footerSignature, '#fef2f2 0%,#fef3c7 100%')
}
