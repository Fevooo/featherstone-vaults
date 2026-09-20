import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const AVAILABILITY = ['AVAILABLE', 'RESERVED', 'SOLD', 'PRIVATE'] as const;

/**
 * Collections — the catalogue departments.
 * Ordered, tiered and fully described here so that the same source drives the
 * homepage strip, the collections index, the footer and the object pages.
 */
const collectionsCollection = defineCollection({
  loader: glob({ base: './src/content/collections', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /** Short form used where the full title will not fit. */
      shortTitle: z.string().optional(),
      /** 'primary' collections appear in the homepage strip. */
      tier: z.enum(['primary', 'secondary']),
      order: z.number(),
      /** One line describing what the department covers. */
      scope: z.string(),
      /** Two or three keywords shown beneath the title in the strip. */
      keywords: z.array(z.string()).min(2).max(4),
      /** Longer introduction shown at the head of the collection page. */
      intro: z.string(),
      plateTone: z.enum(['1', '2', '3', '4']).default('1'),

      /**
       * Department photography can be either a local Astro asset or a stable
       * open-access museum/public-domain URL. Remote imagery is only used as
       * representative department photography, never as a sale-object image.
       */
      image: image().optional(),
      remoteImage: z.string().url().optional(),
      imageAlt: z.string().optional(),
      imageCredit: z.string().optional(),
      imageSourceUrl: z.string().url().optional(),

      seoTitle: z.string().optional(),
      seoDescription: z.string(),
    }),
});

/**
 * Objects — the catalogue itself.
 *
 * Every narrative field is optional. A field that has not yet been researched
 * is left out rather than filled with approximations; the object template
 * renders an explicit "in preparation" line in its place.
 */
const objectsCollection = defineCollection({
  loader: glob({ base: './src/content/objects', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      catalogueNumber: z.string(),
      title: z.string(),
      subtitle: z.string().optional(),
      collection: z.string(),

      /* Classification */
      period: z.string().optional(),
      date: z.string().optional(),
      origin: z.string().optional(),
      culture: z.string().optional(),
      material: z.string().optional(),
      dimensions: z.string().optional(),
      weight: z.string().optional(),

      /* Narrative — supplied per object once catalogued */
      description: z.string().optional(),
      historicalContext: z.string().optional(),
      provenance: z.array(z.string()).optional(),
      condition: z.string().optional(),
      literature: z.array(z.string()).optional(),
      comparativeExamples: z.array(z.string()).optional(),
      certification: z.array(z.string()).optional(),

      /* Commercial */
      price: z.number().optional(),
      currency: z.string().default('GBP'),
      priceOnApplication: z.boolean().default(false),
      availability: z.enum(AVAILABILITY).default('AVAILABLE'),
      soldDate: z.coerce.date().optional(),
      featured: z.boolean().default(false),
      order: z.number().default(100),

      /* Media — `images` stays empty until real photography is supplied. */
      images: z
        .array(
          z.object({
            src: image(),
            alt: z.string(),
            caption: z.string().optional(),
          }),
        )
        .default([]),
      documents: z
        .array(z.object({ label: z.string(), href: z.string() }))
        .default([]),

      /**
       * True for the entries shipped with the site to demonstrate the
       * catalogue format. Specimens carry a visible notice, are excluded from
       * Product structured data and are not indexed.
       */
      specimen: z.boolean().default(false),

      seoTitle: z.string().optional(),
      seoDescription: z.string().optional(),
    }),
});

/**
 * The Journal — long-form editorial.
 */
const journalCollection = defineCollection({
  loader: glob({ base: './src/content/journal', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /** Sentence describing what the article covers. */
      standfirst: z.string(),
      subject: z.string(),
      published: z.coerce.date().optional(),
      updated: z.coerce.date().optional(),
      readingTime: z.string().optional(),
      /** True while the article is still being researched and written. */
      inPreparation: z.boolean().default(false),
      order: z.number().default(100),

      /** Lead image. Shown above the article when supplied. */
      image: image().optional(),
      imageAlt: z.string().optional(),

      seoTitle: z.string().optional(),
      seoDescription: z.string(),
    }),
});

export const collections = {
  collections: collectionsCollection,
  objects: objectsCollection,
  journal: journalCollection,
};
