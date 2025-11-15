import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/services/configService';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Key parameter is required' },
        { status: 400 }
      );
    }

    const value = await getConfig(key);

    if (value === null) {
      return NextResponse.json(
        { error: 'Config key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ key, value });
  } catch (error) {
    console.error('Config API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

