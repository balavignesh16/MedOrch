# Demo checklist

A five-minute walkthrough is in the root `README.md` ("Demo script"). This page is the preparation around it.

## The day before

- [ ] Reboot the presentation machine once, then start everything the way you will on the day.
- [ ] `git status` is clean and you are on the commit you intend to present.
- [ ] `.env` has `NVIDIA_*` pointing at local Ollama. If you want the Gemini button, set `GEMINI_API_KEY` too and check how many free calls remain (about 20 a day on the free tier).
- [ ] The Qwen model is installed: `ollama list` shows `qwen2.5:14b-instruct`.
- [ ] Record a 5-minute screen capture of the full demo (see "Backups").
- [ ] Save the PDF: open `/report`, **Download PDF**, keep a copy on a USB stick.

## An hour before

1. Close other heavy apps (the 14B model wants roughly 9 GB of RAM or VRAM).
2. `start.bat` — it launches the gateway, engine, frontend and, in the background, `scripts/warmup.ps1`, which loads the local models. Wait for the "Warmed ..." line in the warm-up window (about 20-60 seconds on a cold start).
3. Run the checks (about 10 minutes in total):

   ```powershell
   cd frontend
   npm run smoke              # every page loads, no errors, no invented values, report renders to PDF
   npm run smoke:assistant    # the curated questions answer correctly against the live model
   ```

   Both sign in automatically using `database/demo_credentials.txt` (or `SMOKE_USERNAME`/`SMOKE_PASSWORD`). Open the app once so the demo accounts exist, and sign in as `admin` during the demo.
   Both must end with everything passing. Screenshots and `report.pdf` land in `tmp/smoke/`.
4. Open these tabs in order and leave them open: `/data-quality`, `/research`, `/predictive`, `/assistant`, `/report`.
5. In `/assistant`, ask one question first (for example "How many encounters are in each readmitted category?") so the model is warm.

## During the demo

- Follow the README demo script: Data Quality, Research, Predictive, Assistant, Report.
- In the assistant, prefer the suggested questions: each one is tested. Ad-lib questions work often, but the model can still phrase a query the safety checks reject; if that happens, say so — it is the guard doing its job — and use a suggested question.
- If a multi-row answer shows the terse table instead of a written explanation, that is the grounding check refusing an explanation it could not verify against the data. The table is still correct.

## If something goes wrong

| Symptom | Quick fix |
|---|---|
| A question times out | Ask it again (the model is probably cold), or switch the model button to Default/Qwen. |
| "Model unavailable" | `ollama serve` is not running: start it, then `scripts\warmup.ps1`. |
| Gemini says rate limited | You hit the daily quota: switch back to Qwen. |
| A page shows "needs a generated artifact" | Run the regeneration order in `engine/ml/README.md`. |
| Port 3000 is busy | `stop.bat`, then `start.bat`; if a dead process still holds the port, reboot. |
| Everything is broken | Play the recorded video and open the saved PDF. |

## Backups

- **Screen capture** of the full run, recorded the day before on the same machine.
- **PDF** of `/report` saved to disk and USB.
- **Screenshots** from `npm run smoke` (`tmp/smoke/*.png`) as static evidence of each page.

## Honest framing to say out loud

- The data is historical, de-identified (UCI Diabetes 130-US Hospitals, 1999-2008). It is a teaching demonstration, not a clinical tool.
- The model's discrimination is modest (ROC-AUC about 0.67), which is typical for this dataset; the value is in the evaluation, fairness checks and explanations.
- Associations in observational data are not causal effects.
