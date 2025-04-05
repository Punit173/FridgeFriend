import { createTransport } from 'nodemailer'

export const handler = async (req: Request) => {
  const { to, subject, html } = await req.json()

  const transporter = createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'devanshigenai24@gmail.com',
      pass: 'Mini@210569'
    },
  })

  try {
    await transporter.sendMail({
      from: 'devanshigenai24@gmail.com',
      to,
      subject,
      html,
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
} 