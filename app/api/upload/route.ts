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

// Initialize S3 client
function getS3Client() {
  // Support both AWS S3 and Supabase Storage
  const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID || process.env.SUPABASE_STORAGE_ACCESS_KEY;
  const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY || process.env.SUPABASE_STORAGE_SECRET_KEY;
  const endpoint = process.env.AWS_S3_ENDPOINT || process.env.SUPABASE_STORAGE_UPLOAD_ENDPOINT;
  const region = process.env.AWS_S3_REGION || process.env.SUPABASE_STORAGE_REGION || 'us-east-1';

  // Debug logging
  console.log('[S3 Client] Configuration check:');
  console.log('  - Using:', endpoint ? 'Supabase Storage (S3-compatible)' : 'AWS S3');
  console.log('  - Access Key:', accessKeyId ? `${accessKeyId.substring(0, 8)}... (length: ${accessKeyId.length})` : 'NOT SET');
  console.log('  - Secret Key:', secretAccessKey ? `***... (length: ${secretAccessKey.length})` : 'NOT SET');
  console.log('  - Region:', region);
  console.log('  - Upload Endpoint:', endpoint || 'NOT SET (using AWS S3 default)');
  console.log('  - Public Endpoint (for URLs):', process.env.SUPABASE_PUBLIC_ENDPOINT || 'NOT SET');
  console.log('  - Bucket:', process.env.AWS_S3_BUCKET_NAME || process.env.SUPABASE_STORAGE_BUCKET || 'NOT SET');
  console.log('  - Reject Unauthorized:', process.env.AWS_S3_REJECT_UNAUTHORIZED || 'true (default)');
  
  // Validate Supabase Storage upload endpoint format
  if (endpoint && endpoint.includes('/storage/v1/object/public/')) {
    console.error('[S3 Client] ERROR: SUPABASE_STORAGE_UPLOAD_ENDPOINT should be the S3 API endpoint, not the public URL!');
    console.error('[S3 Client] Expected format: https://{project-id}.storage.supabase.co/storage/v1/s3');
    console.error('[S3 Client] Current value:', endpoint);
    throw new Error('Invalid SUPABASE_STORAGE_UPLOAD_ENDPOINT. Use the S3 API endpoint (https://{project-id}.storage.supabase.co/storage/v1/s3), not the public URL endpoint.');
  }

  if (!accessKeyId || !secretAccessKey) {
    const missing = [];
    if (!accessKeyId) missing.push('AWS_S3_ACCESS_KEY_ID or SUPABASE_STORAGE_ACCESS_KEY');
    if (!secretAccessKey) missing.push('AWS_S3_SECRET_ACCESS_KEY or SUPABASE_STORAGE_SECRET_KEY');
    console.error('[S3 Client] Missing credentials:', missing);
    throw new Error(`S3 credentials are not configured. Missing: ${missing.join(', ')}`);
  }

  // Configure HTTP handler to handle self-signed certificates
  // Set AWS_S3_REJECT_UNAUTHORIZED=false in .env.local to allow self-signed certs
  const rejectUnauthorized = process.env.AWS_S3_REJECT_UNAUTHORIZED !== 'false';
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
    requestHandler,
  };

  // Add custom endpoint if provided (for Supabase Storage or other S3-compatible services)
  if (endpoint) {
    clientConfig.endpoint = endpoint;
    clientConfig.forcePathStyle = true; // Required for Supabase Storage and most S3-compatible services
    console.log('[S3 Client] Using S3-compatible service with endpoint:', endpoint);
  } else {
    console.log('[S3 Client] Using AWS S3 (no custom endpoint)');
  }

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

    // Check bucket configuration (supports both AWS S3 and Supabase Storage)
    const bucketName = process.env.AWS_S3_BUCKET_NAME || process.env.SUPABASE_STORAGE_BUCKET;
    if (!bucketName) {
      return NextResponse.json(
        { error: 'S3 bucket not configured. Please set AWS_S3_BUCKET_NAME or SUPABASE_STORAGE_BUCKET' },
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

    // Upload to S3
    console.log('[Upload] Starting S3 upload...');
    console.log('[Upload] File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      fileName: fileName,
      bucketName: bucketName,
    });

    const s3Client = getS3Client();
    const region = process.env.AWS_S3_REGION || 'us-east-1';
    
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

    // Construct file URL
    const endpoint = process.env.AWS_S3_ENDPOINT || process.env.SUPABASE_STORAGE_UPLOAD_ENDPOINT;
    const supabasePublicEndpoint = process.env.SUPABASE_PUBLIC_ENDPOINT; // e.g., https://mlvrmlourfbexrheajut.supabase.co
    let fileUrl: string;
    
    // Check if we're using Supabase Storage (has SUPABASE_STORAGE_UPLOAD_ENDPOINT or SUPABASE_PUBLIC_ENDPOINT)
    const isSupabaseStorage = !!(process.env.SUPABASE_STORAGE_UPLOAD_ENDPOINT || process.env.SUPABASE_PUBLIC_ENDPOINT);
    
    if (isSupabaseStorage && supabasePublicEndpoint) {
      // For Supabase Storage, use the public object URL format
      // Format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
      const baseUrl = supabasePublicEndpoint.replace(/\/$/, ''); // Remove trailing slash
      fileUrl = `${baseUrl}/storage/v1/object/public/${bucketName}/${fileName}`;
      console.log('[Upload] Constructed file URL (Supabase Storage):', fileUrl);
    } else if (isSupabaseStorage && !supabasePublicEndpoint) {
      // Fallback: try to extract project URL from upload endpoint if SUPABASE_PUBLIC_ENDPOINT is not set
      console.warn('[Upload] SUPABASE_PUBLIC_ENDPOINT not set, attempting to derive from upload endpoint');
      if (endpoint && endpoint.includes('.storage.supabase.co')) {
        const projectId = endpoint.match(/https:\/\/([^.]+)\.storage\.supabase\.co/)?.[1];
        if (projectId) {
          fileUrl = `https://${projectId}.supabase.co/storage/v1/object/public/${bucketName}/${fileName}`;
          console.log('[Upload] Constructed file URL (Supabase Storage, derived):', fileUrl);
        } else {
          throw new Error('Cannot construct Supabase Storage URL. Please set SUPABASE_PUBLIC_ENDPOINT in .env.local');
        }
      } else {
        throw new Error('SUPABASE_PUBLIC_ENDPOINT is required for Supabase Storage. Please set it in .env.local');
      }
    } else if (endpoint) {
      // For other S3-compatible services, use path-style URL
      const baseUrl = endpoint.replace(/\/$/, ''); // Remove trailing slash
      fileUrl = `${baseUrl}/${bucketName}/${fileName}`;
      console.log('[Upload] Constructed file URL (S3-compatible):', fileUrl);
    } else {
      // For AWS S3, use virtual-hosted-style URL
      fileUrl = region === 'us-east-1' 
        ? `https://${bucketName}.s3.amazonaws.com/${fileName}`
        : `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;
      console.log('[Upload] Constructed file URL (AWS S3):', fileUrl);
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
      bucketName: process.env.AWS_S3_BUCKET_NAME,
      hasAccessKey: !!process.env.AWS_S3_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_S3_SECRET_ACCESS_KEY,
      accessKeyPrefix: process.env.AWS_S3_ACCESS_KEY_ID?.substring(0, 8),
      region: process.env.AWS_S3_REGION,
      endpoint: process.env.AWS_S3_ENDPOINT,
      rejectUnauthorized: process.env.AWS_S3_REJECT_UNAUTHORIZED,
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
          bucketName: process.env.AWS_S3_BUCKET_NAME,
          region: process.env.AWS_S3_REGION,
          endpoint: process.env.AWS_S3_ENDPOINT,
          hasAccessKey: !!process.env.AWS_S3_ACCESS_KEY_ID,
          hasSecretKey: !!process.env.AWS_S3_SECRET_ACCESS_KEY,
          accessKeyPrefix: process.env.AWS_S3_ACCESS_KEY_ID?.substring(0, 8),
        },
      };
    }
    
    // Provide more specific error messages
    if (error.message?.includes('credentials') || error.name === 'CredentialsProviderError') {
      errorDetails.error = 'AWS credentials are not configured properly. Please check AWS_S3_ACCESS_KEY_ID and AWS_S3_SECRET_ACCESS_KEY';
      return NextResponse.json(errorDetails, { status: 500 });
    }
    
    if (error.name === 'NoSuchBucket' || error.Code === 'NoSuchBucket') {
      errorDetails.error = `S3 bucket "${process.env.AWS_S3_BUCKET_NAME}" not found. Please check AWS_S3_BUCKET_NAME`;
      return NextResponse.json(errorDetails, { status: 500 });
    }
    
    if (error.name === 'InvalidAccessKeyId' || error.Code === 'InvalidAccessKeyId') {
      errorDetails.error = 'Invalid AWS access key. Please check your credentials';
      if (process.env.NODE_ENV === 'development') {
        errorDetails.debug.hint = 'Verify that AWS_S3_ACCESS_KEY_ID matches your S3 service credentials. For Supabase Storage, use the S3 Access Key from Supabase dashboard.';
      }
      return NextResponse.json(errorDetails, { status: 500 });
    }
    
    if (error.name === 'SignatureDoesNotMatch' || error.Code === 'SignatureDoesNotMatch') {
      return NextResponse.json(
        { error: 'AWS secret access key is incorrect' },
        { status: 500 }
      );
    }
    
    if (error.name === 'AccessDenied' || error.Code === 'AccessDenied') {
      return NextResponse.json(
        { error: 'Access denied to S3 bucket. Please check bucket permissions and IAM policy' },
        { status: 500 }
      );
    }
    
    // Handle SSL certificate errors
    if (error.message?.includes('self-signed certificate') || error.message?.includes('certificate') || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
      return NextResponse.json(
        { 
          error: 'SSL certificate verification failed. If using Supabase Storage or a custom S3 endpoint, set AWS_S3_REJECT_UNAUTHORIZED=false in .env.local',
          details: process.env.NODE_ENV === 'development' ? {
            hint: 'Add AWS_S3_REJECT_UNAUTHORIZED=false to your .env.local file to allow self-signed certificates'
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
          bucketName: process.env.AWS_S3_BUCKET_NAME,
          region: process.env.AWS_S3_REGION,
          endpoint: process.env.AWS_S3_ENDPOINT,
          hasAccessKey: !!process.env.AWS_S3_ACCESS_KEY_ID,
          hasSecretKey: !!process.env.AWS_S3_SECRET_ACCESS_KEY,
          accessKeyPrefix: process.env.AWS_S3_ACCESS_KEY_ID?.substring(0, 8),
        },
      };
    }
    
    return NextResponse.json(genericErrorResponse, { status: 500 });
  }
}

