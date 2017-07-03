<?php
/**
 * Test
 *
 * @copyright Copyright 2007-2012 Roy Rosenzweig Center for History and New Media
 * @license http://www.gnu.org/licenses/gpl-3.0.txt GNU GPLv3
 */

/**
 * The Test plugin.
 *
 * @package Omeka\Plugins\Verovio
 */
class VerovioPlugin extends Omeka_Plugin_AbstractPlugin
{
    protected $_extensionFiles = array(
        'mei','xml'
    );

    protected $_MEI_XML_file;

    protected $_hooks = array(
      'install',
      'uninstall',
      'uninstall_message', 
      'config_form',
      'config',
      'public_head',
      'admin_head',
      'verovio_viewer'
    );

    public function hookInstall()
    {
      $db = $this->_db;
      $sql1 = "UPDATE `$db->Option` SET `value` = CONCAT(value, ',xml,mei') WHERE NAME = 'file_extension_whitelist'";
      $sql2 = "UPDATE `$db->Option` SET `value` = CONCAT(value, ',application/xml') WHERE `name` = 'file_mime_type_whitelist'";    
      $db->query($sql1);
      $db->query($sql2);
      set_option('verovio_default_zoom', '40');
      set_option('verovio_default_height', '400');
    }

    public function hookUninstall()
    {
      delete_option('verovio_default_zoom');
      delete_option('verovio_default_height');
    }
    
    /**
     * Display the uninstall message.
     */
    public function hookUninstallMessage()
    {
        echo __('%sWarning%s: To disallow new partitions to be added to items, '
          . 'you must remove manually "xml, mei" and "application/xml" from application\'s security '
          . 'settings.%s', '<p><strong>', '</strong>', '</p>');
    }

    public function hookAdminHead($args)
    {
      queue_js_file('verovio-toolkit');
      queue_js_file('jquery.min');
      queue_js_file('verovio-functions');
    }

    public function hookPublicHead($args)
    {
      queue_js_file('verovio-toolkit');
      queue_js_file('jquery.min');
      queue_js_file('jquery.touchSwipe.min');
      queue_js_file('verovio-functions');
    }

    public function hookConfigForm()
    {
      include 'config_form.php';
    }

    public function hookConfig($args)
    {
        // Use the form to set a bunch of default options in the db
        set_option('verovio_default_zoom', $_POST['default_zoom']);
        set_option('verovio_default_height', $_POST['default_height']);
    }


    public function hookVerovioViewer() {
      $files = get_current_record('item')->Files;
		  $thefile;
      foreach ($files as $file) {
	         $extension = pathinfo($file->filename, PATHINFO_EXTENSION);
           if (!in_array(strtolower($extension), $this->_extensionFiles)) {
             continue;
           } else {
		         $thefile = $file;
             echo '<div id="meiviewer">
      <div id="visio-nav">
        <div class="buttons">
          <p>Go to page [1-<span id="total_text">1</span>]</p>
          <p class="not-mobile">(Press left- or right-key to change screen)</p>
          <p class="mobile">(Swipe left or right to change screen)</p>
          <button onclick="first_page()" type="button">|<<</button><button onclick="prev_page()" type="button"><<</button><input type="text" class="form-control" placeholder="0" id="jump_text" onkeypress="do_page_enter(event)"/><button onclick="next_page()" type="button">>></button><button onclick="last_page()" type="button">>>|</button>
        </div>
        <div class="buttons">
          <p>Zoom</p>
          <p class="not-mobile">(Click or double-click to zoom or unzoom)</p>
          <p class="mobile">(Tap or double-tap to zoom or unzoom)</p>
          <button onclick="zoom_out()" type="button">-</button><input type="text" placeholder="100%" id="zoom_text" onkeypress="do_zoom_enter(event)"/><button onclick="zoom_in()">+</button>
        </div>
        <div class="buttons">
          <p>Viewer height</p>
          <button onclick="height_minus()" type="button">-</button><input type="text" id="height_viewer" disabled/><button onclick="height_more()">+</button>
        </div>
        <div class="buttons fullscreen-btn">
          <p>Fullscreen</p>
          <button onclick="fullscreen()" type="button">X</button>
        </div>
    </div>
    <div id="output"></div>
  </div>

  <script type="text/javascript">
    /* Create the vrvToolkit */
    var vrvToolkit = new verovio.toolkit();
    var page = 1;
    var zoom = '.get_option('verovio_default_zoom').';
    var pageHeight = '.get_option('verovio_default_height').';
    var pageWidth = 20;
    var swipe_pages = false;
    var log = true;

    $( document ).ready(function() {
       $(window).keyup(function(event){
           if ( event.ctrlKey && (event.keyCode == 37) ) { // (Maj + ) Ctrl + gauche
               first_page();
           }
           else if ( event.keyCode == 37 ) { // gauche
               prev_page();
           }
           else if ( event.ctrlKey && (event.keyCode == 39) ) { // (Maj + ) Ctrl + droite
               last_page();
           }
           else if ( event.keyCode == 39 ) { // droite
               next_page();
           }
           // see http://www.javascripter.net/faq/keycodes.htm
           else if ( (event.keyCode == 107) || (event.keyCode == 187) || (event.keyCode == 61)  ) { // +
               zoom_in();
           }
           else if ( (event.keyCode == 109) || (event.keyCode == 189) || (event.keyCode == 173) ) { // -
               zoom_out();
           }
       });

       $(window).resize(function(){
           update_viewer();
       });

       load_file("'.$thefile->getWebPath('original').'");
    });
	</script>
  ';
      break;
      }
    }
  }
}
