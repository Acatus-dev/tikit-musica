<?php
/**
 * The LinkToItem plugin.
 *
 * @package Omeka\Plugins\LinkToItem
 */
class LinkToItemPlugin extends Omeka_Plugin_AbstractPlugin
{
  protected $_hooks = array(
      'install',
      'uninstall',
      'define_acl'
  );
  protected $_filters = array(
    'admin_navigation_main'
  );

  private $_actualElement;
  private $_nbElement;
  private $_results;

  public function hookInstall() {
    $db = $this->_db;
    $sql = "
      CREATE TABLE IF NOT EXISTS `$db->Linktoitem` (
  	  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  	  `from_collection_id` int(10) unsigned DEFAULT NULL,
  	  `from_item_type_id` int(10) unsigned DEFAULT NULL,
      `from_title_elementset` varchar(255) DEFAULT NULL,
      `from_title_element_id` int(10) DEFAULT NULL,
      `from_elementset` varchar(255) DEFAULT NULL,
      `from_element_id` int(10) DEFAULT NULL,
  	  `to_collection_id` int(10) unsigned DEFAULT NULL,
  	  `to_item_type_id` int(10) unsigned DEFAULT NULL,
      `to_elementset` varchar(255) DEFAULT NULL,
      `to_element_id` int(10) DEFAULT NULL,
  	  PRIMARY KEY (`id`)
  	) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci";
  	$db->query($sql);
    set_option("linktoitem_active", "1");
  }
  public function hookUninstall()
  {
    $db = $this->_db;
    $sql = "DROP TABLE `$db->linktoitem`;";
    $db->query($sql);
    delete_option("linktoitem_active");
  }

  public function setUp(){
      // Au chargement du plugin, génération des filters
      // if () {
      parent::setUp();
      if (get_option("linktoitem_active")) {
        $links_to_item = get_db()->getTable('Linktoitem')->findAll();

        foreach($links_to_item as $link_to_item) {
          $link_to_item->getFromElementNameTitle();
          add_filter(array('Display', 'Item', $link_to_item->from_title_elementset, $link_to_item->getFromElementNameTitle()), array($this, 'filter_link_to_item'));
        }
      }
  }

  public function filter_link_to_item($text, $args)
  {
    if (@!is_null($args['element_text']) && $args['element_text'] !== false) {    
      $elementText = $args['element_text'];
      if ($this->_actualElement != $elementText->element_id) {
        $this->_actualElement = $elementText->element_id;
        $this->_nbElement = 0;
      }
      else {
        $this->_nbElement ++;
      }
    }

    

    if (trim($text) == '' || !$elementText) return $text;
    
    $item_id = $args['record']['id'];
    $item = get_db()->getTable("Item")->find($item_id);

    $element_id = $elementText['element_id'];
    if ($this->_nbElement == 0) {
      $link_to_item = new Linktoitem;
      $this->_results = $link_to_item->getLinktoItem($item_id, $element_id);
    }

    if (isset($this->_results[$this->_nbElement])) {
      $url = $this->url($this->_results[$this->_nbElement]);
    } else {
      $url = "#";
    }
    
    if ($url != "") {
      return "<a href=\"$url\">$text</a>";
    } else {
      return $text;
    }
  }

  private function url($result){
    if ($result && !is_null($result)) {
      return html_escape(public_url('items/show/'.$result->id));
    }
  }

  public function hookDefineAcl($args)
  {
    // Restrict access to super and admin users.
    $args['acl']->addResource('LinkToItem_Index');
  }
  public function filterAdminNavigationMain($nav)
    {
        $nav[] = array(
            'label' => 'Link to item',
            'uri' => url('link-to-item'),
            'resource' => 'LinkToItem_Index',
            'privilege' => 'index'
        );
        return $nav;
    }
}
