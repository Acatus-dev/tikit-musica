<?php
/**
 * The Link To Item index controller class.
 *
 */
class LinkToItem_IndexController extends Omeka_Controller_AbstractActionController
{
    public function init()
    {
        $this->_helper->db->setDefaultModelName('Linktoitem');
    }

  public function indexAction()
  {
// Chargement des listes de collections / de Item Type / des elements
      $this->view->csrf = new Omeka_Form_SessionCsrf;
      $this->view->collections = get_db()->getTable('Collection')->findPairsForSelectForm();
      $this->view->itemtypes = get_db()->getTable('ItemType')->findPairsForSelectForm();

      $table = get_db()->getTable('Element');
      $select = $table->getSelect()
          ->order('elements.element_set_id')
          ->order('ISNULL(elements.order)')
          ->order('elements.order');
      $this->view->elements = $table->fetchObjects($select);

      $this->view->links_to_item = get_db()->getTable('Linktoitem')->findAll();
// Chargement des données de la table paramétrée.
// TODO
    }

    public function addAction()
    {
        $this->_validatePost();
        if ($this->getRequest()->isPost()){
          $post = $this->getRequest()->getPost();
          $element_titre = explode(",", $post['elementtitre1'], 2);
          $identifiant1 = explode(",", $post['identifiant1'], 2);
          $identifiant2 = explode(",", $post['identifiant2'], 2);

          $linktoitem = new Linktoitem;
          $linktoitem->from_collection_id = $post['collection1'];
          $linktoitem->from_item_type_id = $post['itemtype1'];
          $linktoitem->from_title_elementset = $element_titre[0];
          $linktoitem->from_title_element_id = $element_titre[1];
          $linktoitem->from_elementset = $identifiant1[0];
          $linktoitem->from_element_id = $identifiant1[1];
          $linktoitem->to_collection_id = $post['collection2'];
          $linktoitem->to_item_type_id = $post['itemtype2'];
          $linktoitem->to_elementset = $identifiant2[0];
          $linktoitem->to_element_id = $identifiant2[1];

          $linktoitem->save();
          $this->_helper->FlashMessenger->addMessage('Link added successfully','success');
        } else {
                   $this->_helper->FlashMessenger->addMessage('Error, please retry.','error');
        }

        $this->_helper->redirector('index');
    }


    public function deleteAction()
    {
        $this->_validatePost();
        if( ! $id = $this->getParam('id') )
            die('error');
        if ($link = get_record_by_id("Linktoitem", $id)) {
          $link->delete();
          $this->_helper->FlashMessenger->addMessage('Link deleted successfully','success');
        } else {
          $this->_helper->FlashMessenger->addMessage('Unable to find link in the database.','error');
        }

        $this->_helper->redirector('index');
    }


    private function _validatePost(){
        $csrf = new Omeka_Form_SessionCsrf;
        if (!$csrf->isValid($_POST))
            die('ERROR');
        return $csrf;
    }

}
