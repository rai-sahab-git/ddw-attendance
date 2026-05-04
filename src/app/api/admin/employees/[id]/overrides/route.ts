import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supa = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET — fetch all overrides for employee
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const { data, error } = await supa()
        .from('employee_type_overrides')
        .select('*')
        .eq('employee_id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
}

// POST — upsert override
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const body = await req.json()
    const { type_code, override_amount, override_multiplier } = body

    if (!type_code) return NextResponse.json({ error: 'type_code required' }, { status: 400 })

    const { error } = await supa()
        .from('employee_type_overrides')
        .upsert(
            { employee_id: id, type_code, override_amount, override_multiplier },
            { onConflict: 'employee_id,type_code' }
        )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}

// DELETE — remove override (revert to global)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const { type_code } = await req.json()

    const { error } = await supa()
        .from('employee_type_overrides')
        .delete()
        .eq('employee_id', id)
        .eq('type_code', type_code)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}