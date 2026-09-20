import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const AVAILABILITY = ['AVAILABLE', 'RESERVED', 'SOLD', 'PRIVATE'] as const

const collectionsCollection = defineCollection({
  loader: glob({ base: './src/content/collections', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      shortTitle: z.string().optional(),
      tier: z.enum(['primary', 'secondary']),
      order: z.number(),
      scope: z.string(),
      keywords: z.array(z.string()).min(2).max(4),
      intro: z.string(),
      plateTone: z.enum(['1', '2', '3', '4']).default('1'),
      image: image().optional(),
      remoteImage: z.string().url().optional(),
      imageAlt: z.string().optional(),
      imageCredit: z.string().optional(),
      imageSourceUrl: z.string().url().optional(),
      seoTitle: z.string().optional(),
      seoDescription: z.string(),
    }),
})

const objectsCollection = defineCollection({
  loader: glob({ base: './src/content/objects', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      catalogueNumber: z.string(),
      title: z.string(),
      subtitle: z.string().optional(),
      collection: z.string(),
      period: z.string().optional(),
      date: z.string().optional(),
      origin: z.string().optional(),
      culture: z.string().optional(),
      material: z.string().optional(),
      dimensions: z.string().optional(),
      weight: z.string().optional(),
      description: z.string().optional(),
      historicalContext: z.string().optional(),
      provenance: z.array(z.string()).optional(),
      condition: z.string().optional(),
      literature: z.array(z.string()).optional(),
      comparativeExamples: z.array(z.string()).optional(),
      certification: z.array(z.string()).optional(),
      price: z.number().optional(),
      currency: z.string().default('GBP'),
      priceOnApplication: z.boolean().default(false),
      availability: z.enum(AVAILABILITY).default('AVAILABLE'),
      soldDate: z.coerce.date().optional(),
      featured: z.boolean().default(false),
      order: z.number().default(100),
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
      specimen: z.boolean().default(false),
      seoTitle: z.string().optional(),
      seoDescription: z.string().optional(),
    }),
})

const journalCollection = defineCollection({
  loader: glob({ base: './src/content/journal', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      standfirst: z.string(),
      subject: z.string(),
      published: z.coerce.date().optional(),
      updated: z.coerce.date().optional(),
      readingTime: z.string().optional(),
      inPreparation: z.boolean().default(false),
      order: z.number().default(100),
      collection: z.string().optional(),
      keywords: z.array(z.string()).default([]),
      image: image().optional(),
      remoteImage: z.string().url().optional(),
      imageAlt: z.string().optional(),
      imageCredit: z.string().optional(),
      imageSourceUrl: z.string().url().optional(),
      sources: z
        .array(
          z.object({
            label: z.string(),
            url: z.string().url(),
          }),
        )
        .default([]),
      seoTitle: z.string().optional(),
      seoDescription: z.string(),
    }),
})

export const collections = {
  collections: collectionsCollection,
  objects: objectsCollection,
  journal: journalCollection,
}
