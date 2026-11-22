import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'
import { CurriculumSeedSchema } from '../src/shared/tracks-contracts.ts'

describe('Offline CEFR Curriculum Seed', () => {
  it('validates all tracks, cheat sheets, and 5-step lesson sequences against Zod', () => {
    const seedPath = path.join(
      process.cwd(),
      'src',
      'main',
      'database',
      'data',
      'curriculum-seed.json'
    )
    const raw = JSON.parse(fs.readFileSync(seedPath, 'utf-8')) as unknown
    const tracks = CurriculumSeedSchema.parse(raw)

    assert.equal(tracks.length, 6)

    const expectedOrder = [
      'shadowing',
      'listening_repeat',
      'open_qa',
      'micro_writing',
      'roleplay'
    ] as const

    const trackSlugs = new Set<string>()
    for (const track of tracks) {
      assert.equal(trackSlugs.has(track.slug), false, `Duplicate track slug: ${track.slug}`)
      trackSlugs.add(track.slug)
      assert.ok(track.lessons.length >= 1)

      for (const lesson of track.lessons) {
        assert.ok(lesson.cheatSheet.length >= 3 && lesson.cheatSheet.length <= 5)
        assert.equal(lesson.activities.length, 5)

        const sorted = [...lesson.activities].sort((a, b) => a.stepOrder - b.stepOrder)
        for (let i = 0; i < expectedOrder.length; i++) {
          assert.equal(sorted[i]?.stepOrder, i + 1)
          assert.equal(sorted[i]?.payload.type, expectedOrder[i])
        }
      }
    }
  })
})
