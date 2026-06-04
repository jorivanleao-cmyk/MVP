import { Router, Request, Response } from 'express'
import {
  getGoogleAuthUrl,
  handleGoogleCallback,
  getGoogleAuthStatus,
} from './auth.service'
import { requireAdminAuth } from '../../middleware/adminAuth'

const router = Router()

router.get('/google', requireAdminAuth, (_req: Request, res: Response) => {
  const url = getGoogleAuthUrl()
  res.json({ url })
})

router.get('/google/callback', async (req: Request, res: Response) => {
  const code = String(req.query.code || '')
  if (!code) {
    return res.status(400).send('Código de autorização ausente.')
  }

  try {
    await handleGoogleCallback(code)
    return res.send(
      '<p>Google Calendar conectado com sucesso! Pode fechar esta aba.</p>',
    )
  } catch (error: any) {
    return res
      .status(500)
      .send(`Falha ao conectar ao Google Calendar: ${error.message || error}`)
  }
})

router.get(
  '/google/status',
  requireAdminAuth,
  async (_req: Request, res: Response) => {
    const authorized = await getGoogleAuthStatus()
    res.json({ authorized })
  },
)

export default router
