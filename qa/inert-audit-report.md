# Inert Dropdown Audit — ASPCA

- Generated: 2026-11-16 22:06 UTC · run time 1m 34s
- Source: http://127.0.0.1:8644/dist/local/main.mjml
- Method: each Select option rendered in isolation (every other field at its default) at 600px (desktop — the template breakpoint `min-width:600px` matches) and 375px (mobile), light mode only (dark-scheme media neutralized). A field is INERT at a viewport when every option rasters byte-identical (SHA-256 over RGBA) to the all-defaults baseline — and, for a field whose frame offers an arrangement Select (Layout / Image Position / Column Order), when it stays byte-identical re-swept under each alternate arrangement too; a control any arrangement revives is not inert, and its check names the reviving arrangement. Every image src is stubbed to a fixed per-URL placeholder, so image-URL Selects are exempt by construction (see appendix).
- Fields: 116 Selects · 116 render-tested · 0 static-exempt · 0 skipped
- Verdicts: inert 8 @600 · 7 @375 · 7 @both · partial 3 · live 106
- Checks: 116 PASS · 0 FAIL. A field PASSES when its measured behavior matches what its label and kind promise — equivalently, when "Apply findings" has nothing to propose for it.
- Phase 1 of 3 — single-field sweeps; pairwise sweeps and universal-vs-block classification follow.

## Known suspects — Padding / Block Padding Left/Right / Column Width / Button Width

| Block | Field | Family | Options | Inert @600 | Inert @375 | Inert @both | Check | Detail |
|---|---|---|---|---|---|---|---|---|
| Preheader Text | Preheader Text · Block Padding Left/Right (`block_width`) | block-width | 3 | no | no | no | PASS | live: Full Bleed, Double |
| Footer (links) | Footer (links) · Mobile Padding Left/Right (`row_1_width`) | block-width | 3 | **YES** | no | no | PASS | live: Full Bleed, Double |

45 further suspect fields live at both viewports or scoped to one by design.

## Findings by category

### Ungrouped
| Block | Field | Family | Options | Inert @600 | Inert @375 | Inert @both | Check | Detail |
|---|---|---|---|---|---|---|---|---|
| Preheader Text | Preheader Text · Block Padding Top (`block_padding_top`) | padding | 5 | no | no | no | PASS | — |
| Preheader Text | Preheader Text · Block Padding Bottom (`block_padding_bottom`) | padding | 5 | no | no | no | PASS | — |
| Preheader Text | Preheader Text · Block Padding Left/Right (`block_width`) | block-width | 3 | no | no | no | PASS | live: Full Bleed, Double |
| Preheader Text | Text · Text Color (`text_text_color`) | color | 11 | no | no | no | PASS | — |
| Preheader Text | Text · Link Color (`link_color`) | link-color | 3 | **YES** | **YES** | **YES** | PASS | expected-inert: no hook-eligible link in this copy (live once an editor adds one) |
| Preheader Text | Text · Alignment (`text_alignment`) | other | 2 | no | no | no | PASS | — |
| Preheader Text | Bottom Spacer · Height (`spacer_gap`) | spacer-height | 5 | no | no | no | PASS | — |
| Header Image | Header Image · Block Background Color (`block_background_color`) | color | 10 | no | no | no | PASS | — |
| Header Image | Header Image · Block 2 - Background Color (`block_2_background_color`) | color | 10 | no | no | no | PASS | — |
| Header Image | Header Image · Block Padding Top (`block_padding_top`) | padding | 5 | no | no | no | PASS | — |
| Header Image | Header Image · Block Padding Bottom (`block_padding_bottom`) | padding | 5 | no | no | no | PASS | — |
| Header Image | Image · Link (`image_link`) | link-toggle | 1 | **YES** | **YES** | **YES** | PASS | non-visual by design (href-only) |
| Header Image | Bottom Spacer · Height (`spacer_gap`) | spacer-height | 5 | no | no | no | PASS | — |
| WYSIWYG Text | WYSIWYG Text · Block Background Color (`block_background_color`) | color | 10 | no | no | no | PASS | — |
| WYSIWYG Text | WYSIWYG Text · Block 2 - Background Color (`block_2_background_color`) | color | 10 | no | no | no | PASS | — |
| WYSIWYG Text | WYSIWYG Text · Block Padding Top (`block_padding_top`) | padding | 5 | no | no | no | PASS | — |
| WYSIWYG Text | WYSIWYG Text · Block Padding Bottom (`block_padding_bottom`) | padding | 5 | no | no | no | PASS | — |
| WYSIWYG Text | WYSIWYG Text · Block Padding Left/Right (`block_width`) | block-width | 3 | no | no | no | PASS | — |
| WYSIWYG Text | Paragraph Copy · Link Color (`link_color`) | link-color | 3 | **YES** | **YES** | **YES** | PASS | expected-inert: no hook-eligible link in this copy (live once an editor adds one) |
| WYSIWYG Text | Bottom Spacer · Height (`spacer_gap`) | spacer-height | 5 | no | no | no | PASS | — |
| Image 1x1 (inset) | Image 1x1 (inset) · Block Background Color (`block_background_color`) | color | 10 | no | no | no | PASS | — |
| Image 1x1 (inset) | Image 1x1 (inset) · Block 2 - Background Color (`block_2_background_color`) | color | 10 | no | no | no | PASS | — |
| Image 1x1 (inset) | Image 1x1 (inset) · Block Padding Top (`block_padding_top`) | padding | 5 | no | no | no | PASS | — |
| Image 1x1 (inset) | Image 1x1 (inset) · Block Padding Bottom (`block_padding_bottom`) | padding | 5 | no | no | no | PASS | — |
| Image 1x1 (inset) | Bottom Spacer · Height (`spacer_gap`) | spacer-height | 5 | no | no | no | PASS | — |
| Heading (centered) | Heading (centered) · Block Background Color (`block_background_color`) | color | 10 | no | no | no | PASS | — |
| Heading (centered) | Heading (centered) · Block 2 - Background Color (`block_2_background_color`) | color | 10 | no | no | no | PASS | — |
| Heading (centered) | Heading (centered) · Block Padding Top (`block_padding_top`) | padding | 5 | no | no | no | PASS | — |
| Heading (centered) | Heading (centered) · Block Padding Bottom (`block_padding_bottom`) | padding | 5 | no | no | no | PASS | — |
| Heading (centered) | Heading (centered) · Block Padding Left/Right (`block_width`) | block-width | 3 | no | no | no | PASS | live: Full Bleed, Half, Double |
| Heading (centered) | Heading · Link Color (`link_color`) | link-color | 3 | **YES** | **YES** | **YES** | PASS | expected-inert: no hook-eligible link in this copy (live once an editor adds one) |
| Heading (centered) | Heading · Alignment (`heading_alignment`) | other | 2 | no | no | no | PASS | — |
| Heading (centered) | Bottom Spacer · Height (`spacer_gap`) | spacer-height | 5 | no | no | no | PASS | — |
| Divider | Divider · Block Background Color (`block_background_color`) | color | 10 | no | no | no | PASS | — |
| Divider | Divider · Block 2 - Background Color (`block_2_background_color`) | color | 10 | no | no | no | PASS | — |
| Divider | Divider · Block Padding Top (`block_padding_top`) | padding | 5 | no | no | no | PASS | — |
| Divider | Divider · Block Padding Bottom (`block_padding_bottom`) | padding | 5 | no | no | no | PASS | — |
| Divider | Divider · Block Padding Left/Right (`block_width`) | block-width | 3 | no | no | no | PASS | — |
| Divider | Bottom Spacer · Height (`spacer_gap`) | spacer-height | 5 | no | no | no | PASS | — |
| Signature | Signature · Block Background Color (`block_background_color`) | color | 10 | no | no | no | PASS | — |
| Signature | Signature · Block 2 - Background Color (`block_2_background_color`) | color | 10 | no | no | no | PASS | — |
| Signature | Signature · Link Color (`link_color`) | link-color | 3 | **YES** | **YES** | **YES** | PASS | expected-inert: no hook-eligible link in this copy (live once an editor adds one) |
| Signature | Signature · Block Padding Top (`block_padding_top`) | padding | 5 | no | no | no | PASS | — |
| Signature | Signature · Block Padding Bottom (`block_padding_bottom`) | padding | 5 | no | no | no | PASS | — |
| Signature | Signature · Block Padding Left/Right (`block_width`) | block-width | 3 | no | no | no | PASS | — |
| Signature | Paragraph Copy 1 · Display (`paragraph_copy_1_display`) | display-toggle | 1 | no | no | no | PASS | — |
| Signature | Paragraph Copy 1 · Spacing Below (`paragraph_copy_1_spacing_below`) | spacing-below | 5 | no | no | no | PASS | — |
| Signature | Image · Display (`image_display`) | display-toggle | 1 | no | no | no | PASS | — |
| Signature | Image · Alignment (`image_alignment`) | other | 2 | no | no | no | PASS | — |
| Signature | Image · Spacing Below (`image_spacing_below`) | spacing-below | 5 | no | no | no | PASS | — |
| Signature | Paragraph Copy 2 · Display (`paragraph_copy_2_display`) | display-toggle | 1 | no | no | no | PASS | — |
| Signature | Bottom Spacer · Height (`spacer_gap`) | spacer-height | 5 | no | no | no | PASS | — |
| Gift Receipt | Gift Receipt · Block Background Color (`block_background_color`) | color | 10 | no | no | no | PASS | — |
| Gift Receipt | Gift Receipt · Block 2 - Background Color (`block_2_background_color`) | color | 10 | no | no | no | PASS | — |
| Gift Receipt | Gift Receipt · Link Color (`link_color`) | link-color | 3 | **YES** | **YES** | **YES** | PASS | expected-inert: no hook-eligible link in this copy (live once an editor adds one) |
| Gift Receipt | Gift Receipt · Block Padding Top (`block_padding_top`) | padding | 5 | no | no | no | PASS | — |
| Gift Receipt | Gift Receipt · Block Padding Bottom (`block_padding_bottom`) | padding | 5 | no | no | no | PASS | — |
| Gift Receipt | Gift Receipt · Block Padding Left/Right (`block_width`) | block-width | 3 | no | no | no | PASS | — |
| Gift Receipt | Paragraph Copy 1 · Display (`paragraph_copy_1_display`) | display-toggle | 1 | no | no | no | PASS | — |
| Gift Receipt | Paragraph Copy 2 · Display (`paragraph_copy_2_display`) | display-toggle | 1 | no | no | no | PASS | — |
| Gift Receipt | Bottom Spacer · Height (`spacer_gap`) | spacer-height | 5 | no | no | no | PASS | — |
| Gift Receipt (boxed) | Gift Receipt (boxed) · Wrapper Background Color (`wrapper_background_color`) | color | 10 | no | no | no | PASS | — |
| Gift Receipt (boxed) | Gift Receipt (boxed) · Block Background Color (`block_background_color`) | color | 10 | no | no | no | PASS | — |
| Gift Receipt (boxed) | Gift Receipt (boxed) · Block 2 - Background Color (`block_2_background_color`) | color | 10 | no | no | no | PASS | — |
| Gift Receipt (boxed) | Gift Receipt (boxed) · Link Color (`link_color`) | link-color | 3 | **YES** | **YES** | **YES** | PASS | expected-inert: no hook-eligible link in this copy (live once an editor adds one) |
| Gift Receipt (boxed) | Gift Receipt (boxed) · Wrapper Padding Top (`wrapper_padding_top`) | padding | 5 | no | no | no | PASS | — |
| Gift Receipt (boxed) | Gift Receipt (boxed) · Wrapper Padding Bottom (`wrapper_padding_bottom`) | padding | 5 | no | no | no | PASS | — |
| Gift Receipt (boxed) | Gift Receipt (boxed) · Block Padding Top (`block_padding_top`) | padding | 5 | no | no | no | PASS | — |
| Gift Receipt (boxed) | Gift Receipt (boxed) · Block Padding Bottom (`block_padding_bottom`) | padding | 5 | no | no | no | PASS | — |
| Gift Receipt (boxed) | Paragraph Copy 1 · Display (`paragraph_copy_1_display`) | display-toggle | 1 | no | no | no | PASS | — |
| Gift Receipt (boxed) | Paragraph Copy 1 · Text Color (`paragraph_copy_1_text_color`) | color | 11 | no | no | no | PASS | — |
| Gift Receipt (boxed) | Paragraph Copy 1 · Spacing Below (`paragraph_copy_1_spacing_below`) | spacing-below | 5 | no | no | no | PASS | — |
| Gift Receipt (boxed) | Paragraph Copy 2 · Display (`paragraph_copy_2_display`) | display-toggle | 1 | no | no | no | PASS | — |
| Gift Receipt (boxed) | Paragraph Copy 2 · Text Color (`paragraph_copy_2_text_color`) | color | 11 | no | no | no | PASS | — |
| Gift Receipt (boxed) | Bottom Spacer · Height (`spacer_gap`) | spacer-height | 5 | no | no | no | PASS | — |
| Images 2x2 | Images 2x2 · Background Color (`row_1_background_color`) | color | 10 | no | no | no | PASS | — |
| Images 2x2 | Images 2x2 · Background Color (`row_0_background_color`) | color | 10 | no | no | no | PASS | — |
| Images 2x2 | Images 2x2 · Column Order (`column_order`) | arrangement | 1 | no | no | no | PASS | — |
| Images 2x2 | Images 2x2 · Padding Top (`row_1_padding_top`) | padding | 5 | no | no | no | PASS | — |
| Images 2x2 | Images 2x2 · Padding Bottom (`row_1_padding_bottom`) | padding | 5 | no | no | no | PASS | — |
| Images 2x2 | Images 2x2 · Padding Left/Right (`row_1_width`) | block-width | 3 | no | no | no | PASS | — |
| Images 2x2 | Row 2 · Background Color (`row_2_background_color`) | color | 10 | no | no | no | PASS | — |
| Images 2x2 | Row 2 · Column Order (`column_order_2`) | arrangement | 1 | no | no | no | PASS | — |
| Images 2x2 | Row 2 · Padding Top (`row_2_padding_top`) | padding | 5 | no | no | no | PASS | — |
| Images 2x2 | Row 2 · Padding Bottom (`row_2_padding_bottom`) | padding | 5 | no | no | no | PASS | — |
| Images 2x2 | Row 2 · Padding Left/Right (`row_2_width`) | block-width | 3 | no | no | no | PASS | — |
| Images 2x2 | └─ Bottom Spacer · Height (`spacer_gap`) | spacer-height | 5 | no | no | no | PASS | — |
| Footer (links) | Footer (links) · Background Color (`row_1_background_color`) | color | 10 | no | no | no | PASS | — |
| Footer (links) | Footer (links) · Padding Top (`row_1_padding_top`) | padding | 5 | no | no | no | PASS | — |
| Footer (links) | Footer (links) · Padding Bottom (`row_1_padding_bottom`) | padding | 5 | no | no | no | PASS | — |
| Footer (links) | Footer (links) · Mobile Padding Left/Right (`row_1_width`) | block-width | 3 | **YES** | no | no | PASS | live: Full Bleed, Double |
| Footer (links) | └─ Row 1 Paragraph Copy · Text Color (`row_1_paragraph_copy_text_color`) | color | 11 | no | no | no | PASS | — |
| Footer (links) | └─ Row 1 Paragraph Copy · Link Color (`row_1_paragraph_copy_link_color`) | link-color | 3 | no | no | no | PASS | — |
| Footer (links) | └─ Row 1 Paragraph Copy · Alignment (`row_1_paragraph_copy_alignment`) | other | 2 | no | no | no | PASS | — |
| Footer (links) | Row 2 · Background Color (`row_2_background_color`) | color | 10 | no | no | no | PASS | — |
| Footer (links) | └─ Row 2 Spacer 1 · Height (`spacer_1_height`) | spacer-height | 5 | no | no | no | PASS | — |
| Footer (links) | └─ Bottom Spacer · Height (`spacer_2_gap`) | spacer-height | 5 | no | no | no | PASS | — |
| Footer (w/ social icons) | Footer (w/ social icons) · Wrapper Background Color (`wrapper_background_color`) | color | 10 | no | no | no | PASS | — |
| Footer (w/ social icons) | Footer (w/ social icons) · Background Color (`row_1_background_color`) | color | 10 | no | no | no | PASS | — |
| Footer (w/ social icons) | Footer (w/ social icons) · Wrapper Padding Top (`wrapper_padding_top`) | padding | 5 | no | no | no | PASS | — |
| Footer (w/ social icons) | Footer (w/ social icons) · Wrapper Padding Bottom (`wrapper_padding_bottom`) | padding | 5 | no | no | no | PASS | — |
| Footer (w/ social icons) | Footer (w/ social icons) · Wrapper Padding Left (`wrapper_padding_left`) | padding | 5 | no | no | no | PASS | — |
| Footer (w/ social icons) | Footer (w/ social icons) · Wrapper Padding Right (`wrapper_padding_right`) | padding | 5 | no | no | no | PASS | — |
| Footer (w/ social icons) | Footer (w/ social icons) · Padding Top (`row_1_padding_top`) | padding | 5 | no | no | no | PASS | — |
| Footer (w/ social icons) | Footer (w/ social icons) · Padding Bottom (`row_1_padding_bottom`) | padding | 5 | no | no | no | PASS | — |
| Footer (w/ social icons) | Footer (w/ social icons) · Padding Left (`row_1_padding_left`) | padding | 5 | no | no | no | PASS | — |
| Footer (w/ social icons) | Footer (w/ social icons) · Padding Right (`row_1_padding_right`) | padding | 5 | no | no | no | PASS | — |
| Footer (w/ social icons) | Row 2 · Background Color (`row_2_background_color`) | color | 10 | no | no | no | PASS | — |
| Footer (w/ social icons) | Row 2 · Padding Top (`row_2_padding_top`) | padding | 5 | no | no | no | PASS | — |
| Footer (w/ social icons) | Row 2 · Padding Bottom (`row_2_padding_bottom`) | padding | 5 | no | no | no | PASS | — |
| Footer (w/ social icons) | Row 2 · Padding Left (`row_2_padding_left`) | padding | 5 | no | no | no | PASS | — |
| Footer (w/ social icons) | Row 2 · Padding Right (`row_2_padding_right`) | padding | 5 | no | no | no | PASS | — |
| Footer (w/ social icons) | └─ Row 2 Paragraph Copy · Text Color (`row_2_paragraph_copy_text_color`) | color | 11 | no | no | no | PASS | — |
| Footer (w/ social icons) | └─ Row 2 Paragraph Copy · Link Color (`row_2_paragraph_copy_link_color`) | link-color | 3 | no | no | no | PASS | — |
| Footer (w/ social icons) | └─ Row 2 Paragraph Copy · Alignment (`row_2_paragraph_copy_alignment`) | other | 2 | no | no | no | PASS | — |
| Footer (w/ social icons) | └─ Bottom Spacer · Height (`spacer_gap`) | spacer-height | 5 | no | no | no | PASS | — |
