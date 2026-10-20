/**
 * @fileoverview Target names and env overlay for `npm run dev:live`.
 */

const {
	TRUTH_SLEUTH_STUDY_AGENCY_ID,
	PROLIFIC_SAMPLE_NAME,
	resolveTarget,
	resolveStudyAgencyId,
	buildLiveEnv,
	stripEmulatorHosts,
} = require('../dev-live')

describe('dev-live targets', () => {
	it('defaults to Truth Sleuth live', () => {
		expect(resolveTarget()).toMatchObject({
			id: 'ts',
			brand: 'misinfo',
			study: false,
			envFile: '.env.local',
		})
		expect(resolveTarget('truthsleuth').id).toBe('ts')
	})

	it('accepts the four site names', () => {
		expect(resolveTarget('ts-study')).toMatchObject({ id: 'ts-study', study: true, brand: 'misinfo' })
		expect(resolveTarget('caffeine')).toMatchObject({
			id: 'caffeine',
			study: false,
			brand: 'caffeine',
			envFile: '.env.caffeine.local',
		})
		expect(resolveTarget('caffeine-study')).toMatchObject({ id: 'caffeine-study', study: true })
	})

	it('rejects an unknown name', () => {
		expect(resolveTarget('nope')).toBeNull()
	})
})

describe('dev-live env overlay', () => {
	const baseEnv = {
		NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'misinfo-5d004',
		NEXT_PUBLIC_FIREBASE_API_KEY: 'ts-key',
		NEXT_PUBLIC_FIXED_REPORT_AGENCY_ID: 'from-dotenv-local',
		NEXT_PUBLIC_FIXED_REPORT_AGENCY_NAME: 'Prolific sample',
		GOOGLE_APPLICATION_CREDENTIALS: './ts.json',
		OTHER_SECRET: 'leave-me',
	}

	it('blanks the agency variables on a live run', () => {
		const target = resolveTarget('ts')
		const env = buildLiveEnv({
			baseEnv,
			targetEnv: baseEnv,
			target,
			studyAgencyId: resolveStudyAgencyId(target, baseEnv),
		})
		expect(env.NEXT_PUBLIC_FIXED_REPORT_AGENCY_ID).toBe('')
		expect(env.NEXT_PUBLIC_FIXED_REPORT_AGENCY_NAME).toBe('')
		expect(env.NEXT_PUBLIC_BRAND).toBe('misinfo')
		expect(env.NEXT_PUBLIC_USE_EMULATORS).toBe('false')
	})

	it('sets both agency variables for Truth Sleuth Study', () => {
		const target = resolveTarget('ts-study')
		const env = buildLiveEnv({
			baseEnv,
			targetEnv: baseEnv,
			target,
			studyAgencyId: resolveStudyAgencyId(target, {}),
		})
		expect(env.NEXT_PUBLIC_FIXED_REPORT_AGENCY_ID).toBe(TRUTH_SLEUTH_STUDY_AGENCY_ID)
		expect(env.NEXT_PUBLIC_FIXED_REPORT_AGENCY_NAME).toBe(PROLIFIC_SAMPLE_NAME)
	})

	it('lets the Caffeine file win and blanks Truth Sleuth-only keys', () => {
		const target = resolveTarget('caffeine')
		const targetEnv = {
			NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'caffeine-app-d8cd8',
			NEXT_PUBLIC_BRAND: 'caffeine',
			GOOGLE_APPLICATION_CREDENTIALS: './caffeine.json',
			STUDY_AGENCY_ID: 'should-not-be-copied',
		}
		const env = buildLiveEnv({
			baseEnv,
			targetEnv,
			target,
			studyAgencyId: resolveStudyAgencyId(target, targetEnv),
		})
		expect(env.NEXT_PUBLIC_FIREBASE_PROJECT_ID).toBe('caffeine-app-d8cd8')
		expect(env.NEXT_PUBLIC_FIREBASE_API_KEY).toBe('')
		expect(env.GOOGLE_APPLICATION_CREDENTIALS).toBe('./caffeine.json')
		expect(env.STUDY_AGENCY_ID).toBeUndefined()
		expect(env.OTHER_SECRET).toBeUndefined()
		expect(env.NEXT_PUBLIC_FIXED_REPORT_AGENCY_ID).toBe('')
		expect(env.NEXT_PUBLIC_BRAND).toBe('caffeine')
	})

	it('requires STUDY_AGENCY_ID for Caffeine Study and then sets both agency variables', () => {
		const target = resolveTarget('caffeine-study')
		expect(() => resolveStudyAgencyId(target, {})).toThrow(/STUDY_AGENCY_ID/)
		const env = buildLiveEnv({
			baseEnv,
			targetEnv: { STUDY_AGENCY_ID: 'caff-prolific' },
			target,
			studyAgencyId: resolveStudyAgencyId(target, { STUDY_AGENCY_ID: 'caff-prolific' }),
		})
		expect(env.NEXT_PUBLIC_FIXED_REPORT_AGENCY_ID).toBe('caff-prolific')
		expect(env.NEXT_PUBLIC_FIXED_REPORT_AGENCY_NAME).toBe(PROLIFIC_SAMPLE_NAME)
		expect(env.NEXT_PUBLIC_FIREBASE_PROJECT_ID).toBe('')
	})

	it('removes emulator host variables', () => {
		const env = stripEmulatorHosts({
			FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
			FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
			NEXT_PUBLIC_BRAND: 'misinfo',
		})
		expect(env.FIRESTORE_EMULATOR_HOST).toBeUndefined()
		expect(env.FIREBASE_AUTH_EMULATOR_HOST).toBeUndefined()
		expect(env.NEXT_PUBLIC_BRAND).toBe('misinfo')
	})
})
