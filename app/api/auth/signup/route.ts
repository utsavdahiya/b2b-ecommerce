import { NextResponse } from 'next/server';
import { signup } from '@/lib/services/authService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await signup(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    // Set HTTP-only cookie for token
    const response = NextResponse.json({
      success: true,
      message: result.message,
      user: result.user,
    });

    response.cookies.set('auth_token', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

