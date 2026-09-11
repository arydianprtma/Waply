import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-user';
import { getTop4xxPaths, getUrlScanSummary, getAllUrlScans, clearUrlScans, recordUrlScan } from '@/lib/url-tracker';

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '403 Forbidden: Akses khusus Super Admin' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const topPaths = getTop4xxPaths(limit);
    const summary = getUrlScanSummary();
    const allScans = getAllUrlScans();

    return NextResponse.json({
      success: true,
      data: {
        topPaths,
        summary,
        allScans,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal memuat data URL scans' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '403 Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    if (body.path) {
      recordUrlScan(body.path, {
        method: body.method || 'GET',
        statusCode: body.statusCode || 404,
        ip: body.ip || '127.0.0.1',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'URL scan berhasil dicatat',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const user = await getSessionUser();
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '403 Forbidden' },
        { status: 403 }
      );
    }

    clearUrlScans();
    return NextResponse.json({
      success: true,
      message: 'Riwayat URL scan berhasil dibersihkan',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
