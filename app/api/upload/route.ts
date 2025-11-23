import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import { verifyToken } from '@/lib/services/authService';
import { cookies } from 'next/headers';
import https from 'https';

async function getUserIdFromToken(): Promise<number | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    const decoded = verifyToken(token);
    return decoded?.userId || null;
  } catch (error) {
    return null;
  }
}

// Initialize Supabase Storage S3 client
function getS3Client() {
  const accessKeyId = process.env.SUPABASE_STORAGE_ACCESS_KEY;
  const secretAccessKey = process.env.SUPABASE_STORAGE_SECRET_KEY;
  const endpoint = process.env.SUPABASE_STORAGE_UPLOAD_ENDPOINT;
  const region = process.env.SUPABASE_STORAGE_REGION || 'us-east-1';

  // Debug logging
  console.log('[Supabase Storage] Configuration check:');
  console.log('  - Access Key:', accessKeyId ? `${accessKeyId.substring(0, 8)}... (length: ${accessKeyId.length})` : 'NOT SET');
  console.log('  - Secret Key:', secretAccessKey ? `***... (length: ${secretAccessKey.length})` : 'NOT SET');
  console.log('  - Region:', region);
  console.log('  - Upload Endpoint:', endpoint || 'NOT SET');
  console.log('  - Public Endpoint (for URLs):', process.env.SUPABASE_PUBLIC_ENDPOINT || 'NOT SET');
  console.log('  - Bucket:', process.env.SUPABASE_STORAGE_BUCKET || 'NOT SET');
  console.log('  - Reject Unauthorized:', process.env.SUPABASE_REJECT_UNAUTHORIZED !== 'false');
  
  // Validate required configuration
  if (!accessKeyId || !secretAccessKey) {
    const missing = [];
    if (!accessKeyId) missing.push('SUPABASE_STORAGE_ACCESS_KEY');
    if (!secretAccessKey) missing.push('SUPABASE_STORAGE_SECRET_KEY');
    console.error('[Supabase Storage] Missing credentials:', missing);
    throw new Error(`Supabase Storage credentials are not configured. Missing: ${missing.join(', ')}`);
  }

  if (!endpoint) {
    throw new Error('SUPABASE_STORAGE_UPLOAD_ENDPOINT is required. Please set it in .env.local');
  }

  // Validate Supabase Storage upload endpoint format
  if (endpoint.includes('/storage/v1/object/public/')) {
    console.error('[Supabase Storage] ERROR: SUPABASE_STORAGE_UPLOAD_ENDPOINT should be the S3 API endpoint, not the public URL!');
    console.error('[Supabase Storage] Expected format: https://{project-id}.storage.supabase.co/storage/v1/s3');
    console.error('[Supabase Storage] Current value:', endpoint);
    throw new Error('Invalid SUPABASE_STORAGE_UPLOAD_ENDPOINT. Use the S3 API endpoint (https://{project-id}.storage.supabase.co/storage/v1/s3), not the public URL endpoint.');
  }

  // Configure HTTP handler to handle self-signed certificates
  // Set SUPABASE_REJECT_UNAUTHORIZED=false in .env.local to allow self-signed certs
  const rejectUnauthorized = process.env.SUPABASE_REJECT_UNAUTHORIZED !== 'false';
  const requestHandler = new NodeHttpHandler({
    httpsAgent: new https.Agent({
      rejectUnauthorized,
    }),
  });

  const clientConfig: any = {
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    endpoint,
    forcePathStyle: true, // Required for Supabase Storage
    requestHandler,
  };

  console.log('[Supabase Storage] Using endpoint:', endpoint);

  return new S3Client(clientConfig);
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const userId = await getUserIdFromToken();
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check bucket configuration
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET;
    if (!bucketName) {
      return NextResponse.json(
        { error: 'Supabase Storage bucket not configured. Please set SUPABASE_STORAGE_BUCKET' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type (allow common image and document formats)
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/svg+xml',
      'image/ai',
      'application/postscript',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed. Please upload images (JPG, PNG, GIF, WebP, SVG) or documents (PDF, DOC, DOCX)' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `uploads/${timestamp}-${randomString}.${fileExtension}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Supabase Storage
    console.log('[Upload] Starting Supabase Storage upload...');
    console.log('[Upload] File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      fileName: fileName,
      bucketName: bucketName,
    });

    const s3Client = getS3Client();
    
    // Try with ACL first, fallback to without ACL if bucket doesn't allow it
    let command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read', // Make file publicly accessible
    });

    try {
      console.log('[Upload] Attempting upload with ACL...');
      const response = await s3Client.send(command);
      console.log('[Upload] Upload successful:', {
        etag: response.ETag,
        versionId: response.VersionId,
      });
    } catch (aclError: any) {
      console.log('[Upload] ACL upload failed, error:', {
        name: aclError.name,
        message: aclError.message,
        code: aclError.Code,
      });
      
      // If ACL fails, try without ACL (bucket policy should handle public access)
      if (aclError.name === 'AccessControlListNotSupported' || aclError.message?.includes('ACL')) {
        console.log('[Upload] Retrying upload without ACL...');
        command = new PutObjectCommand({
          Bucket: bucketName,
          Key: fileName,
          Body: buffer,
          ContentType: file.type,
        });
        const response = await s3Client.send(command);
        console.log('[Upload] Upload successful (without ACL):', {
          etag: response.ETag,
          versionId: response.VersionId,
        });
      } else {
        throw aclError;
      }
    }

    // Construct Supabase Storage public file URL
    const supabasePublicEndpoint = process.env.SUPABASE_PUBLIC_ENDPOINT;
    let fileUrl: string;
    
    if (supabasePublicEndpoint) {
      // Use the public object URL format
      // Format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
      const baseUrl = supabasePublicEndpoint.replace(/\/$/, ''); // Remove trailing slash
      fileUrl = `${baseUrl}/storage/v1/object/public/${bucketName}/${fileName}`;
      console.log('[Upload] Constructed file URL:', fileUrl);
    } else {
      // Fallback: try to extract project URL from upload endpoint
      console.warn('[Upload] SUPABASE_PUBLIC_ENDPOINT not set, attempting to derive from upload endpoint');
      const uploadEndpoint = process.env.SUPABASE_STORAGE_UPLOAD_ENDPOINT;
      if (uploadEndpoint && uploadEndpoint.includes('.storage.supabase.co')) {
        const projectId = uploadEndpoint.match(/https:\/\/([^.]+)\.storage\.supabase\.co/)?.[1];
        if (projectId) {
          fileUrl = `https://${projectId}.supabase.co/storage/v1/object/public/${bucketName}/${fileName}`;
          console.log('[Upload] Constructed file URL (derived):', fileUrl);
        } else {
          throw new Error('Cannot construct Supabase Storage URL. Please set SUPABASE_PUBLIC_ENDPOINT in .env.local');
        }
      } else {
        throw new Error('SUPABASE_PUBLIC_ENDPOINT is required. Please set it in .env.local');
      }
    }

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
  } catch (error: any) {
    // Comprehensive error logging
    console.error('========== FILE UPLOAD ERROR ==========');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.Code);
    console.error('Error statusCode:', error.$metadata?.httpStatusCode);
    // Try to serialize error with all properties
    let serializedError: any = {};
    try {
      serializedError = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
    } catch (e) {
      serializedError = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code,
        Code: error.Code,
        $metadata: error.$metadata,
      };
    }
    console.error('Full error object:', serializedError);
    console.error('Environment check:', {
      bucketName: process.env.SUPABASE_STORAGE_BUCKET,
      hasAccessKey: !!process.env.SUPABASE_STORAGE_ACCESS_KEY,
      hasSecretKey: !!process.env.SUPABASE_STORAGE_SECRET_KEY,
      accessKeyPrefix: process.env.SUPABASE_STORAGE_ACCESS_KEY?.substring(0, 8),
      uploadEndpoint: process.env.SUPABASE_STORAGE_UPLOAD_ENDPOINT,
      publicEndpoint: process.env.SUPABASE_PUBLIC_ENDPOINT,
      rejectUnauthorized: process.env.SUPABASE_REJECT_UNAUTHORIZED !== 'false',
    });
    console.error('========================================');
    
    // Build detailed error response for development
    const errorDetails: any = {
      error: error.message || 'Failed to upload file',
    };

    if (process.env.NODE_ENV === 'development') {
      errorDetails.debug = {
        name: error.name,
        code: error.Code,
        statusCode: error.$metadata?.httpStatusCode,
        message: error.message,
        stack: error.stack,
        config: {
          bucketName: process.env.SUPABASE_STORAGE_BUCKET,
          uploadEndpoint: process.env.SUPABASE_STORAGE_UPLOAD_ENDPOINT,
          publicEndpoint: process.env.SUPABASE_PUBLIC_ENDPOINT,
          hasAccessKey: !!process.env.SUPABASE_STORAGE_ACCESS_KEY,
          hasSecretKey: !!process.env.SUPABASE_STORAGE_SECRET_KEY,
          accessKeyPrefix: process.env.SUPABASE_STORAGE_ACCESS_KEY?.substring(0, 8),
        },
      };
    }
    
    // Provide more specific error messages
    if (error.message?.includes('credentials') || error.name === 'CredentialsProviderError') {
      errorDetails.error = 'Supabase Storage credentials are not configured properly. Please check SUPABASE_STORAGE_ACCESS_KEY and SUPABASE_STORAGE_SECRET_KEY';
      return NextResponse.json(errorDetails, { status: 500 });
    }
    
    if (error.name === 'NoSuchBucket' || error.Code === 'NoSuchBucket') {
      errorDetails.error = `Supabase Storage bucket "${process.env.SUPABASE_STORAGE_BUCKET}" not found. Please check SUPABASE_STORAGE_BUCKET`;
      return NextResponse.json(errorDetails, { status: 500 });
    }
    
    if (error.name === 'InvalidAccessKeyId' || error.Code === 'InvalidAccessKeyId') {
      errorDetails.error = 'Invalid Supabase Storage access key. Please check your credentials';
      if (process.env.NODE_ENV === 'development') {
        errorDetails.debug.hint = 'Verify that SUPABASE_STORAGE_ACCESS_KEY matches your Supabase Storage S3 Access Key from the Supabase dashboard.';
      }
      return NextResponse.json(errorDetails, { status: 500 });
    }
    
    if (error.name === 'SignatureDoesNotMatch' || error.Code === 'SignatureDoesNotMatch') {
      return NextResponse.json(
        { error: 'Supabase Storage secret access key is incorrect' },
        { status: 500 }
      );
    }
    
    if (error.name === 'AccessDenied' || error.Code === 'AccessDenied') {
      return NextResponse.json(
        { error: 'Access denied to Supabase Storage bucket. Please check bucket permissions and policies' },
        { status: 500 }
      );
    }
    
    // Handle SSL certificate errors
    if (error.message?.includes('self-signed certificate') || error.message?.includes('certificate') || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
      return NextResponse.json(
        { 
          error: 'SSL certificate verification failed. Set SUPABASE_REJECT_UNAUTHORIZED=false in .env.local',
          details: process.env.NODE_ENV === 'development' ? {
            hint: 'Add SUPABASE_REJECT_UNAUTHORIZED=false to your .env.local file to allow self-signed certificates'
          } : undefined
        },
        { status: 500 }
      );
    }
    
    // Generic error handler - always include debug in development
    const genericErrorResponse: any = {
      error: error.message || 'Failed to upload file',
    };
    
    if (process.env.NODE_ENV === 'development') {
      genericErrorResponse.debug = {
        name: error.name,
        code: error.Code,
        statusCode: error.$metadata?.httpStatusCode,
        message: error.message,
        stack: error.stack,
        config: {
          bucketName: process.env.SUPABASE_STORAGE_BUCKET,
          uploadEndpoint: process.env.SUPABASE_STORAGE_UPLOAD_ENDPOINT,
          publicEndpoint: process.env.SUPABASE_PUBLIC_ENDPOINT,
          hasAccessKey: !!process.env.SUPABASE_STORAGE_ACCESS_KEY,
          hasSecretKey: !!process.env.SUPABASE_STORAGE_SECRET_KEY,
          accessKeyPrefix: process.env.SUPABASE_STORAGE_ACCESS_KEY?.substring(0, 8),
        },
      };
    }
    
    return NextResponse.json(genericErrorResponse, { status: 500 });
  }
}

