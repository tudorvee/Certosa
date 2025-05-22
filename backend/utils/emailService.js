const nodemailer = require('nodemailer');
const Restaurant = require('../models/Restaurant');

// Create a direct Gmail transporter - absolutely minimal
const createDirectTransporter = async (restaurantId) => {
  console.log('Creating DIRECT GMAIL transporter for restaurant:', restaurantId);
  
  // Get the restaurant's email configuration
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant || !restaurant.emailConfig) {
    console.error('Restaurant not found or missing email configuration');
    throw new Error('Restaurant email configuration not found');
  }

  console.log(`Using restaurant email: ${restaurant.emailConfig.senderEmail}`);
  console.log(`Using app password: ${'*'.repeat((restaurant.emailConfig.smtpPassword || '').length)}`);
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: restaurant.emailConfig.senderEmail,
      pass: restaurant.emailConfig.smtpPassword
    }
  });
  
  // Test the connection
  try {
    const verified = await transporter.verify();
    console.log('Transporter verified:', verified);
    return transporter;
  } catch (error) {
    console.error('Error verifying transporter:', error);
    throw error;
  }
};

// Super simplified email sending
const sendEmail = async (supplierEmail, items, restaurantId, note) => {
  try {
    console.log('🔴 SENDING EMAIL DIRECTLY TO:', supplierEmail);
    console.log('🔴 WITH NOTE:', note);
    
    // Get restaurant info
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }
    
    // Create direct transporter
    const transporter = await createDirectTransporter(restaurantId);
    
    // Check if this is a note-only email
    const isNoteOnly = (!items || items.length === 0) && note && note.trim().length > 0;
    
    // Build a simple HTML with the note visible
    let itemsHtml = '';
    if (items && items.length > 0) {
      for (const item of items) {
        // Use customUnit if available, otherwise fall back to original unit
        const displayUnit = item.customUnit || item.unit;
        
        // Simple clean formatting with just quantity and unit in bold
        itemsHtml += `<tr>
          <td>${item.name}</td>
          <td><strong>${item.quantity} ${displayUnit}</strong></td>
        </tr>`;
      }
    } else if (isNoteOnly) {
      // For note-only emails, we'll show a placeholder
      itemsHtml = `<tr><td colspan="2" style="text-align:center; font-style:italic;">Nessun articolo - solo nota</td></tr>`;
    }
    
    // Make the note extremely visible
    const noteHtml = note ? `
    <div style="padding:15px; margin:15px 0; background:#ffffd0; border:2px solid red;">
      <h2 style="color:red; margin-top:0;">NOTA:</h2>
      <p style="font-size:16px; font-weight:bold;">${note}</p>
    </div>` : '';
    
    // Create the table section only if we have items or it's not a note-only email
    let tableSection = '';
    if (!isNoteOnly || items.length > 0) {
      tableSection = `
      <table border="1" cellpadding="5" style="border-collapse:collapse; width:100%;">
        <tr style="background:#f0f0f0;">
          <th>Articolo</th>
          <th>Quantità</th>
        </tr>
        ${itemsHtml}
      </table>`;
    }
    
    // Define the postscript text
    const postscriptHtml = `
    <hr>
    <p style="font-size:12px; color:#555;">
      <strong>P.S. Ricordati che il nuovo codice destinatario per la fatturazione è cambiato. Altrimenti non saranno prese in carico le fatture per i pagamento:</strong><br><br>
      QUI STA PANCRAZIO S.R.L.<br>
      P. IVA: 16389011004<br>
      SDI K95IV18<br><br>
      MAMMAMIAMAMMAMIA SRL<br>
      (Ristorante: Pizza Forum)<br>
      P. IVA: 15523151007<br>
      SDI K95IV18<br><br>
      FESTAB SRL<br>
      (Ristoranti: Mino e Luigi Cantina e Cucina)<br>
      P. IVA: 16551941004<br>
      SDI K95IV18<br><br>
      Il nuovo codice SDI K95IV18 sostituisce il precedente ~SUBM70N~ per tutte le comunicazioni di fatturazione elettronica.
    </p>
    `;

    // Simplified email template
    const emailHtml = `
    <html>
    <body>
      <h2>${isNoteOnly ? 'SOLO NOTA' : 'Ordine'} da ${restaurant.name}</h2>
      
      ${noteHtml}
      
      ${tableSection}
      
      <p>Grazie,<br>${restaurant.name}</p>
      
      ${postscriptHtml}
    </body>
    </html>
    `;
    
    // Add the note to the subject line
    let subject;
    if (isNoteOnly) {
      subject = `⚠️ SOLO NOTA: ${note.substring(0, 30)}${note.length > 30 ? '...' : ''}`;
    } else if (note) {
      subject = `🟡 ORDINE CON NOTA: ${note.substring(0, 20)}${note.length > 20 ? '...' : ''}`;
    } else {
      subject = `Nuovo Ordine`;
    }
      
    console.log('🔴 SENDING HTML EMAIL:', emailHtml);
    
    // Send the email
    const info = await transporter.sendMail({
      from: `"${restaurant.name}" <${restaurant.emailConfig.senderEmail}>`,
      to: supplierEmail,
      subject: subject,
      html: emailHtml
    });
    
    console.log('🔴 EMAIL SENT:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Simple test email function
const sendTestEmail = async (restaurantId) => {
  try {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }
    
    // Create direct transporter
    const transporter = await createDirectTransporter(restaurantId);
    
    // Test HTML email
    const testHtml = `
    <html>
    <body>
      <h2>Test Email from ${restaurant.name}</h2>
      <p>This is a test email to verify that your email configuration works.</p>
      <p>Time: ${new Date().toISOString()}</p>
    </body>
    </html>
    `;
    
    const info = await transporter.sendMail({
      from: `"${restaurant.name}" <${restaurant.emailConfig.senderEmail}>`,
      to: restaurant.emailConfig.senderEmail,
      subject: 'Test Email',
      html: testHtml
    });
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Test email error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Test email with note
const sendBasicEmail = async (supplierEmail, restaurantId, noteText) => {
  try {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }
    
    // Create direct transporter
    const transporter = await createDirectTransporter(restaurantId);
    
    // Test HTML with note
    const testHtml = `
    <html>
    <body>
      <h2>Test Email with Note</h2>
      
      <div style="padding:15px; margin:15px 0; background:#ffffd0; border:2px solid red;">
        <h2 style="color:red; margin-top:0;">NOTA DI TEST:</h2>
        <p style="font-size:16px; font-weight:bold;">${noteText}</p>
      </div>
      
      <p>Time: ${new Date().toISOString()}</p>
    </body>
    </html>
    `;
    
    const info = await transporter.sendMail({
      from: `"${restaurant.name}" <${restaurant.emailConfig.senderEmail}>`,
      to: supplierEmail,
      subject: `🟡 TEST CON NOTA: ${noteText.substring(0, 20)}...`,
      html: testHtml
    });
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Basic email error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendEmail,
  sendTestEmail,
  sendBasicEmail
}; 