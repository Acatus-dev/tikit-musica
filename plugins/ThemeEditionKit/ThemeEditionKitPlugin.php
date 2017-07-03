<?php
/**
 * Theme EditionKit
 * 
 * @copyright Copyright 2007-2012 Roy Rosenzweig Center for History and New Media
 * @license http://www.gnu.org/licenses/gpl-3.0.txt GNU GPLv3
 */

require_once dirname(__FILE__) . '/helpers/TruncateHTML.php';
require_once dirname(__FILE__) . '/helpers/ThemeEditionKitFunctions.php';

/**
 * The Theme EditionKit plugin.
 * 
 * @package Omeka\Plugins\ThemeEditionKit
 */
class ThemeEditionKitPlugin extends Omeka_Plugin_AbstractPlugin
{
    protected $_hooks = array(
        'install',
        'uninstall',
        'initialize'
    );
    
    protected $_options = array(

    );
    
    /**
     * Install the plugin.
     */
    public function hookInstall()
    {
        $db = $this->_db;
        if (option('editionkit_installed') != '1') {
            // Si le plugin n'a jamais été installé, le script SQL est exécuté
            try {
                  $filePath = dirname(__FILE__).'/scripts/editionkit_install.sql';
                  if (!is_readable($filePath)) {
                    throw new InvalidArgumentException("Cannot read SQL file at '$filePath'.");
                  }
                  $loadSql = file_get_contents($filePath);
                  $subbedSql = str_replace('%PUBLIC_BASE_URL%', PUBLIC_BASE_URL, $loadSql);
                  $subbedSql = str_replace('%PREFIX%', $db->prefix, $subbedSql);
                  $db->queryBlock($subbedSql, ";\n");
                
                  //$db->loadSqlFile();    
            } catch (Zend_Db_Exception $e) {
                _log($e->getMessage());
                // THROW ERROR
                // throw new Installer_Task_Exception("Unable to install EditionKit plugin"
                //    . get_class($e) . ": " . $e->getMessage());
            }
            set_option('editionkit_installed','1');
        } else {
            _log("Déjà installé");
        }
        $this->_installOptions();
    }
    
    /**
     * Uninstall the plugin.
     */
    public function hookUninstall()
    {
        $this->_uninstallOptions();
        // Ne pas supprimer l'option editionkit_installed
    }
    
    /**
     * Initialize the plugin.
     */
    public function hookInitialize()
    {
       add_shortcode('bloc_simplepage', array($this, 'shortcode_bloc'));
       add_shortcode('no_background', array($this, 'shortcode_nobackground'));
       add_shortcode('home', array($this, 'shortcode_home'));
    }

    public function shortcode_bloc($args, $view)
    {
        $align = 'left';
        $bg = "";
        if (isset($args['align']) && in_array($args['align'], array('left','right','large') ) ) $align = $args['align'];
        if (!$args['slug']) return "";
        $simplepage = get_db()->getTable('SimplePagesPage')->findBySql("slug = ?", $params = array($args['slug']), true);
        if (!$simplepage || !$simplepage['is_published']) return "";
        $file = EDITIONKIT_THEME_FILES_PATH . $args['slug'] . '.jpg';
        if (file_exists($file)) {
            $bg = ' with-bg" style="background-image:url(.'.EDITIONKIT_THEME_FILES_PATH_SHORT. $args['slug'] .'.jpg)';
        };
        $content = '<section class="cartridge '.$align.'">
            <h1 class="cartridge-title">'.$simplepage['title'].'</h1>
            <div class="cartridge-content'. $bg .'">
                <div>'.truncate($simplepage['text'], 300).'<a class="read-more" href="./'.$simplepage['slug'].'">read more &gt;</a></div>
            </div>
        </section>';
        return $content;
    }

    public function shortcode_nobackground($args, $view)
    {
        $content = "<style>#content #primary {
            padding: 0;
            border: 0 none;
            background: none;
            box-shadow: none;
            margin: 0;
        }
        #content #breadcrumb {
            display: none;
        }
        #content #primary > :first-child {
            display: none;
        }
        </style>";
        return $content;
    }

    public function shortcode_home($args, $view)
    {
        $content = "<style>#content #primary {
            padding: 0;
            border: 0 none;
            background: none;
            box-shadow: none;
            margin: 0;
        }
        #content #breadcrumb {
            display: none;
        }
        #content #primary > :first-child {
            display: none;
        }
        </style>";
        return $content;
    }
}
