import { Router } from 'express'
import { handleIncomingWebhook } from './whatsapp.controller'

const router = Router()

router.post('/whatsapp', handleIncomingWebhook)

export default router
