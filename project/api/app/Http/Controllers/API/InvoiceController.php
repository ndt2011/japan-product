<?php

namespace App\Http\Controllers\API;

use App\Exceptions\InvoiceException;
use App\Http\Controllers\Controller;
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

    public function store(Request $request): JsonResponse
    {
        $auth = AuthContext::from($request);

        if (! $auth['user'] instanceof Admin) {
            return ApiResponse::error('M0407', null, 403);
        }

        $request->validate([
            'order_id' => ['required', 'integer', 'exists:orders,id'],
            'note' => ['nullable', 'string', 'max:2000'],
        ]);

        try {
            $invoice = $this->invoiceService->createFromOrder(
                (int) $request->input('order_id'),
                $auth['user'],
                $request->input('note'),
            );
        } catch (InvoiceException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'invoice' => new InvoiceResource($invoice),
        ], 'M0000', 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $auth = AuthContext::from($request);

        if (! $auth['user'] instanceof Admin) {
            return ApiResponse::error('M0407', null, 403);
        }

        $request->validate([
            'note' => ['nullable', 'string', 'max:2000'],
            'due_date' => ['nullable', 'date'],
        ]);

        try {
            $invoice = $this->invoiceService->update($id, $request->only(['note', 'due_date']), $auth['user']);
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

    public function pay(Request $request, int $id): JsonResponse
    {
        $auth = AuthContext::from($request);

        if (! $auth['user'] instanceof Admin) {
            return ApiResponse::error('M0407', null, 403);
        }

        $request->validate([
            'paid_amount' => ['nullable', 'integer', 'min:0'],
            'payment_method' => ['nullable', 'in:bank_transfer,cash,other'],
        ]);

        try {
            $invoice = $this->invoiceService->pay($id, $request->only(['paid_amount', 'payment_method']), $auth['user']);
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
        $html = view('invoices.pdf', ['invoice' => $invoice])->render();
        $filename = $invoice->invoice_no;

        try {
            $options = new Options();
            $options->set('isRemoteEnabled', false);
            $options->set('defaultFont', 'DejaVu Sans');

            $dompdf = new Dompdf($options);
            $dompdf->loadHtml($html);
            $dompdf->setPaper('A4', 'portrait');
            $dompdf->render();

            return response($dompdf->output(), 200, [
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
