import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

type StripeEvent = {
  type: string;
  data: { object: { metadata?: { project_id?: string }; status?: string } };
};

export async function POST(req: Request) {
  const event = (await req.json()) as StripeEvent;

  console.log('stripe webhook', {
    headers: Object.fromEntries(req.headers),
    event,
  });

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
    const projectId = event.data.object.metadata?.project_id;
    const status = event.data.object.status;
    if (projectId && status) {
      await supabaseAdmin.from('projects').update({ billing_status: status }).eq('id', projectId);
    }
  }

  return NextResponse.json({ received: true });
}
