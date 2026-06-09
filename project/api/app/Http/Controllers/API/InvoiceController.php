<?php

namespace App\Http\Controllers\API;

use App\Exceptions\InvoiceException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Invoice\PayInvoiceRequest;
use App\Http\Requests\Invoice\StoreInvoiceRequest;
use App\Http\Requests\Invoice\UpdateInvoiceRequest;
use App\Http\Resources\InvoiceResource;
use App\Models\Admin;
use App\Services\InvoiceService;
use App\Support\ApiResponse;
use App\Support\AuthContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class InvoiceController extends Controller
{
    public function __construct(
        private readonly InvoiceService $invoiceService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $auth = AuthContext::from($request);
        $paginator = $this->invoiceService->list(
            $request->only(['search', 'status', 'company_vn_id', 'from_date', 'to_date', 'per_page']),
            $auth['user'],
            $auth['type'],
        );

        return ApiResponse::success([
            'items' => InvoiceResource::collection($paginator->items()),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    public function debtSummary(Request $request): JsonResponse
    {
        return ApiResponse::success($this->invoiceService->debtSummary());
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $auth = AuthContext::from($request);

        try {
            $invoice = $this->invoiceService->show($id, $auth['user'], $auth['type']);
        } catch (InvoiceException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'invoice' => new InvoiceResource($invoice),
        ]);
    }

    public function store(StoreInvoiceRequest $request): JsonResponse
    {
        $auth = AuthContext::from($request);

        if (! $auth['user'] instanceof Admin) {
            return ApiResponse::error('M0407', null, 403);
        }

        try {
            $invoice = $this->invoiceService->createFromOrder(
                (int) $request->validated('order_id'),
                $auth['user'],
                $request->validated('note'),
            );
        } catch (InvoiceException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'invoice' => new InvoiceResource($invoice),
        ], 'M0000', 201);
    }

    public function update(UpdateInvoiceRequest $request, int $id): JsonResponse
    {
        $auth = AuthContext::from($request);

        if (! $auth['user'] instanceof Admin) {
            return ApiResponse::error('M0407', null, 403);
        }

        try {
            $invoice = $this->invoiceService->update($id, $request->validated(), $auth['user']);
        } catch (InvoiceException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'invoice' => new InvoiceResource($invoice),
        ]);
    }

    public function send(Request $request, int $id): JsonResponse
    {
        $auth = AuthContext::from($request);

        if (! $auth['user'] instanceof Admin) {
            return ApiResponse::error('M0407', null, 403);
        }

        try {
            $invoice = $this->invoiceService->send($id, $auth['user']);
        } catch (InvoiceException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'invoice' => new InvoiceResource($invoice->load(['items', 'company', 'order'])),
        ]);
    }

    public function pay(PayInvoiceRequest $request, int $id): JsonResponse
    {
        $auth = AuthContext::from($request);

        if (! $auth['user'] instanceof Admin) {
            return ApiResponse::error('M0407', null, 403);
        }

        try {
            $invoice = $this->invoiceService->pay($id, $request->validated(), $auth['user']);
        } catch (InvoiceException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'invoice' => new InvoiceResource($invoice),
        ]);
    }

    public function pdf(Request $request, int $id): Response|JsonResponse
    {
        $auth = AuthContext::from($request);

        try {
            $invoice = $this->invoiceService->show($id, $auth['user'], $auth['type']);
        } catch (InvoiceException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        $invoice->loadMissing(['items', 'company', 'order']);
        $filename = $invoice->invoice_no;

        // RULE-INV-05: trả PDF đã lưu — không tái tạo khi file còn tồn tại
        if ($invoice->pdf_path && Storage::disk('local')->exists($invoice->pdf_path)) {
            return response(
                Storage::disk('local')->get($invoice->pdf_path),
                200,
                [
                    'Content-Type'        => 'application/pdf',
                    'Content-Disposition' => 'inline; filename="'.$filename.'.pdf"',
                ],
            );
        }

        $html = view('invoices.pdf', ['invoice' => $invoice])->render();

        try {
            $options = new Options();
            $options->set('isRemoteEnabled', false);
            $options->set('defaultFont', 'DejaVu Sans');

            $dompdf = new Dompdf($options);
            $dompdf->loadHtml($html);
            $dompdf->setPaper('A4', 'portrait');
            $dompdf->render();

            $pdfBytes = $dompdf->output();
            $path     = "invoices/{$invoice->id}/{$filename}.pdf";
            Storage::disk('local')->put($path, $pdfBytes);
            $invoice->update(['pdf_path' => $path]);

            return response($pdfBytes, 200, [
                'Content-Type'        => 'application/pdf',
                'Content-Disposition' => 'inline; filename="'.$filename.'.pdf"',
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response($html, 200, [
                'Content-Type'        => 'text/html; charset=UTF-8',
                'Content-Disposition' => 'inline; filename="'.$filename.'.html"',
            ]);
        }
    }
}
