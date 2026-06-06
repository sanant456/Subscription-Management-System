import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from './auth';

const router = Router();

// Retrieve payment history for user
router.get('/history', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });

  try {
    const list = await db.payment.findMany({
      where: req.user.role === 'ADMIN' ? undefined : { userId: req.user.id }
    });
    
    // Sort descending by date
    const sorted = [...list].sort((a: any, b: any) => {
      const dateA = new Date(a.paymentDate).getTime();
      const dateB = new Date(b.paymentDate).getTime();
      return dateB - dateA;
    });

    res.json({ success: true, payments: sorted });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Download/Retrieve payment receipt details
router.get('/:id/receipt', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });

  try {
    const payment = await db.payment.findUnique({
      where: { id: req.params.id }
    });

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment record not found.' });
    }

    // Access check: users can only see their own receipts, admins see all
    if (req.user.role !== 'ADMIN' && payment.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden. You do not own this invoice statement.' });
    }

    // Mock PDF receipt text representation
    const receiptData = {
      receiptNumber: `REC-${payment.id.toUpperCase()}`,
      paymentId: payment.id,
      transactionId: payment.razorpayPaymentId || 'N/A',
      orderId: payment.razorpayOrderId,
      amountPaid: payment.amount,
      currency: payment.currency,
      status: payment.status,
      date: payment.paymentDate,
      company: 'SubVault SaaS Corp',
      address: 'Outer Ring Road, Bengaluru, India',
      gstin: '29AAAAA1111A1Z1',
      supportEmail: 'billing@subvault.co'
    };

    res.json({
      success: true,
      receipt: receiptData
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
