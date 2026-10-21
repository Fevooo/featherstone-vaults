# Featherstone Vaults business card

`featherstone-vaults-card-print.pdf` is the artwork to send a printer.
Page 1 is the face, page 2 is the reverse.

| | |
| --- | --- |
| Trim size | 85 x 55 mm (the UK and European standard) |
| Bleed | 3 mm on every edge |
| Artboard | 91 x 61 mm |
| Safe margin | nothing readable closer than 4 mm to the trim |
| Colour | RGB |
| Fonts | embedded and subset, no substitution |

## What to tell the printer

**Ask for a rich black on the face.** The dark side is a solid flood of
`#0B0B0A` across the whole card. Converted naively to CMYK it becomes a single
black plate and prints as a flat, washed-out grey rather than a true black.
A rich black build, around C60 M40 Y40 K100, is what makes it look like the
site. Any decent trade printer will do this if asked.

The file is RGB because it is generated from a browser. Most online printers
convert on receipt and that is fine for these colours. If a printer asks for
CMYK, send them this file and the four values below and let them do the
conversion with their own profile, rather than converting it twice.

| Where | Hex |
| --- | --- |
| Face ground, reverse type | `#0B0B0A` |
| Reverse ground, face type | `#EFE9DD` |
| Hairline rule | `#96774A` at 50% |
| Job title | `#6E5733` |
| Location line | `#80776A` |

**Stock.** Uncoated, 400 gsm or heavier. A coated or gloss finish works
against the brand. Soft-touch or a lightly textured uncoated board suits it.
Avoid spot UV, foiling and rounded corners.

## Changing the details

Details live in the `CARD` object at the top of `build-card.mjs`. Adding a
`phone` value puts a phone line under the website; leaving it empty leaves it
off, which is how it currently ships.

```bash
npm i playwright          # not a dependency of the site
node brand/business-card/build-card.mjs
```

That rewrites the PDF and both previews.

## Why there is a second copy of Jost here

`fonts/` holds static cuts of Jost. The site itself ships a variable Jost,
which is correct for the web, but Chromium's PDF export silently substitutes
variable fonts instead of embedding them: the first version of this card
reached the PDF with the labels and contact details in the wrong typeface and
nothing to indicate it. The static cuts embed properly. They are only used to
build the card and are not served by the site.

Jost is licensed under the SIL Open Font License.

## A note on trade fairs

The card carries no trade association marks. Do not add a LAPADA, BADA or
CINOA mark unless the business is a member in good standing: those are
verifiable credentials and the associations do pursue misuse.
