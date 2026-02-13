import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    // Get the site password from environment variable
    const correctPassword = process.env.SITE_ACCESS_PASSWORD

    if (!correctPassword) {
      console.error('SITE_ACCESS_PASSWORD environment variable is not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Verify password
    if (password === correctPassword) {
      // Generate a secure token
      const token = crypto.randomBytes(32).toString('hex')

      // Create response with success
      const response = NextResponse.json({ success: true })

      // Set cookie with the token (valid for 30 days)
      response.cookies.set('site-access-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      })

      // Also store the token in env for middleware to verify
      // Note: In production, you'd want to use a database or cache
      // For simplicity, we'll use a consistent token
      if (!process.env.SITE_ACCESS_TOKEN) {
        process.env.SITE_ACCESS_TOKEN = token
      }

      // Use the same token for consistency
      response.cookies.set('site-access-token', process.env.SITE_ACCESS_TOKEN, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      })

      return response
    }

    // Wrong password
    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Error verifying password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
