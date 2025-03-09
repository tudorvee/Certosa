const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (supplierEmail, items) => {
  // Create items table for email
  const itemsHtml = items.map(item => 
    `<tr>
      <td>${item.name}</td>
      <td>${item.quantity} ${item.unit}</td>
    </tr>`
  ).join('');
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: supplierEmail,
    subject: 'Nuovo Ordine',
    html: `
      <h2>Richiesta di Nuovo Ordine</h2>
      <p>Si prega di fornire i seguenti articoli:</p>
      <table border="1" cellpadding="5" cellspacing="0">
        <tr>
          <th>Articolo</th>
          <th>Quantità</th>
        </tr>
        ${itemsHtml}
      </table>
      <p>Grazie per il vostro servizio.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email inviata correttamente a ${supplierEmail}`);
    return true;
  } catch (error) {
    console.error('Errore nell\'invio email:', error);
    return false;
  }
};

module.exports = sendEmail; 