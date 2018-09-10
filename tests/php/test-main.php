<?php

/**
 * Tests for the main handler.
 */

namespace MG2_Loader;

class Test_Main extends \WP_UnitTestCase {

	/**
	 * Validate proper translation of backend settings to format
	 * expected by the JS Loader.
	 */
	function test_settings() {
		update_option( 'mg2_loader_options', [
			'loader' => [
				'environment' => 'stage',
				'loadAttempts' => 2,
				'blockAttempts' => null,
				'randomURLChoosing' => false,
				'xCode' => 'Code',
				'plugins' => ['FP','NXT','DL'],
			],
			'FP' => [
				'required' => false,
				'version' => '1.0',
				'environment' => 'stage',
			],
			'NXT' => [
				'required' => true,
				'version' => 'TEST_V',
				'environment' => 'stage',
				'clientCode' => 'TEST_C',
				'siteCode' => 'TEST_SITE',
				'configCode' => 'TEST_CONFIG',
				'settingsKey' => 'SK,SK',
				'attr' => 'Attr',
				'debug' => true,
				'silentmode' => false,
			],
			'DL' => [
				'required' => false,
				'version' => '1.15',
				'environment' => 'stage',
				'collectors' => 'connext',
				'tagManager' => 'GTM',
			],
		] );

		$MG2 = Main::instance()->get_settings();

		$this->assertSame( 'stage', $MG2['settings']['environment'] );
		$this->assertNull( $MG2['settings']['blockAttempts'] );
		$this->assertSame( 2, $MG2['settings']['loadAttempts'] );
		$this->assertFalse( $MG2['settings']['randomURLChoosing'] );
		$this->assertSame( 'Code', $MG2['settings']['xCode'] );

		$this->assertSame( 'FP', $MG2['settings']['plugins'][0]['name'] );
		$this->assertFalse( $MG2['settings']['plugins'][0]['required'] );
		$this->assertSame( '1.0', $MG2['settings']['plugins'][0]['initOptions']['version'] );
		$this->assertSame( 'stage', $MG2['settings']['plugins'][0]['initOptions']['environment'] );

		$this->assertSame( 'NXT', $MG2['settings']['plugins'][1]['name'] );
		$this->assertTrue( $MG2['settings']['plugins'][1]['required'] );
		$this->assertSame( 'TEST_V', $MG2['settings']['plugins'][1]['initOptions']['version'] );
		$this->assertSame( 'stage', $MG2['settings']['plugins'][1]['initOptions']['environment'] );
		$this->assertSame( 'TEST_C', $MG2['settings']['plugins'][1]['initOptions']['clientCode'] );
		$this->assertSame( 'TEST_SITE', $MG2['settings']['plugins'][1]['initOptions']['siteCode'] );
		$this->assertSame( 'TEST_CONFIG', $MG2['settings']['plugins'][1]['initOptions']['configCode'] );
		$this->assertSame( 'SK,SK', $MG2['settings']['plugins'][1]['initOptions']['settingsKey'] );
		$this->assertSame( 'Attr', $MG2['settings']['plugins'][1]['initOptions']['attr'] );
		$this->assertTrue( $MG2['settings']['plugins'][1]['initOptions']['debug'] );
		$this->assertFalse( $MG2['settings']['plugins'][1]['initOptions']['silentmode'] );

		$this->assertSame( 'DL', $MG2['settings']['plugins'][2]['name'] );
		$this->assertFalse( $MG2['settings']['plugins'][2]['required'] );
		$this->assertSame( '1.15', $MG2['settings']['plugins'][2]['initOptions']['version'] );
		$this->assertSame( 'stage', $MG2['settings']['plugins'][2]['initOptions']['environment'] );
		$this->assertSame( 'GTM', $MG2['settings']['plugins'][2]['initOptions']['tagManager'] );
		$this->assertSame( ['connext'], $MG2['settings']['plugins'][2]['initOptions']['collectors'] );
	}
}
