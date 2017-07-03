<?php

class Linktoitem extends Omeka_Record_AbstractRecord
{
    public $from_collection_id; // ID de la collection où se trouve le lien
    public $from_item_type_id; // ID du type d'objet où se trouve le lien
    public $from_title_elementset; // Element Set de l'élément où se trouve le lien
    public $from_title_element_id; // ID de l'élément où se trouve le lien
    public $from_elementset; // Element Set de l'élément servant d'ID pour le lien
    public $from_element_id; // Elément sevant d'Id pour le lien
    public $to_collection_id; // Id de la collection de l'item à destination du lien
    public $to_item_type_id; // ID du type d'objet de l'item à destination du lien
    public $to_elementset; // Elément set de l'élément servant de référence au lien
    public $to_element_id; // Id de l'élement servant de référence au lien


    public function getFromCollectionName() {
    	//return "Nom de la collection".$this->from_collection_id;
    	$db = $this->getDb();
      $sql = "SELECT `text` FROM $db->ElementText WHERE record_type = 'Collection' AND record_id = ?";
      $params = array($this->from_collection_id);
      $name = $db->fetchOne($sql, $params);
      return ($name == "") ? '<span style="color:red">ERROR</span>' : $name;
    }
    private function getElementName($element) {
      $result = get_db()->getTable('Element')->find($element);
      return is_null($result) ? '<span style="color:red">ERROR</span>' : $result->name;
    }
    public function getFromElementNameTitle() {
      return $this->getElementName($this->from_title_element_id);
    }
    public function getFromElementName() {
      return $this->getElementName($this->from_element_id);
    }
    public function getToElementName() {
      return $this->getElementName($this->to_element_id);
    }

    public function getToCollectionName() {
     $db = $this->getDb();
      $sql = "SELECT `text` FROM $db->ElementText WHERE record_type = 'Collection' AND record_id = ?";
      $params = array($this->to_collection_id);
      $name = $db->fetchOne($sql, $params);
      return ($name == "") ? '<span style="color:red">ERROR</span>' : $name;
    }
    public function getFromItemTypeName() {
      $result = get_db()->getTable('ItemType')->find($this->from_item_type_id);
      return is_null($result) ? '<span style="color:red">ERROR</span>' : $result->name;
    }
    public function getToItemTypeName() {
      $result = get_db()->getTable('ItemType')->find($this->from_item_type_id);
      return is_null($result) ? '<span style="color:red">ERROR</span>' : $result->name;
    }


   public function getLinktoItem($item_id, $element_id) {
   		// Renvoye l'URL de l'item désigné par les filtres Link To Item existant pour l'item fourni en paramètre
      if ($item_id != "" && $element_id != "") {
        $db = $this->getDb();

        $req = "SELECT TO_ITEM.id FROM {$db->Item} I 

              JOIN {$this->_db->linktoitem} LTI ON
                LTI.FROM_COLLECTION_ID = I.COLLECTION_ID 
                AND LTI.FROM_ITEM_TYPE_ID = I.ITEM_TYPE_ID 
                AND LTI.FROM_TITLE_ELEMENT_ID = $element_id

              JOIN {$db->ElementText} ET ON
                I.ID = ET.RECORD_ID 
                AND ET.RECORD_TYPE = 'Item' 
                AND LTI.FROM_ELEMENT_ID = ET.ELEMENT_ID
                AND I.ID = $item_id
                

              JOIN {$db->Item} TO_ITEM ON
                TO_ITEM.COLLECTION_ID = LTI.TO_COLLECTION_ID 
                AND TO_ITEM.ITEM_TYPE_ID = LTI.TO_ITEM_TYPE_ID 
                AND TO_ITEM.PUBLIC = 1  

              JOIN {$db->ElementText} TO_ET ON
                TO_ITEM.ID = TO_ET.RECORD_ID 
                AND ET.ELEMENT_ID = LTI.FROM_ELEMENT_ID 
                AND LTI.TO_ELEMENT_ID = TO_ET.ELEMENT_ID
                AND TRIM(ET.TEXT) = TRIM(TO_ET.TEXT)";

        $results = get_db()->getTable('Item')->fetchObjects($req);

      }

      return $results;
   }

  /**
   * Validate the form data.
   */
  protected function _validate()
  {
    // Attention : l'erreur affichée n'affiche que la dernière erreur enregistrée.
    // Controle de validité des données
    if ($this->from_collection_id == "0" ||
      $this->from_item_type_id == "0" ||
      $this->from_title_elementset == "0" ||
      is_null($this->from_title_element_id) ||
      $this->from_elementset == "0" ||
      is_null($this->from_element_id) ||
      $this->to_collection_id == "0" ||
      $this->to_item_type_id == "0" ||
      $this->to_elementset == "0" ||
      is_null($this->to_element_id == 0)
      ) {
          $this->addError('Error', 'Form have not been correctly completed.');
         return;
    }

    // Controle si la source et la cible sont le même élément
    if ($this->from_collection_id == $this->to_collection_id &&
      $this->from_item_type_id == $this->to_item_type_id &&
      $this->from_elementset == $this->to_elementset &&
      $this->from_element_id == $this->to_element_id
        ) {
        $this->addError('Error', __('Source element and linked element can\'t be the same.'));
        return;
    }

    // Controle si une liaison existe déjà sur cet élément
    $requete = "SELECT *
    FROM {$this->_db->linktoitem} LTI WHERE
    LTI.from_collection_id = $this->from_collection_id AND
    LTI.from_item_type_id = $this->from_item_type_id AND
    LTI.from_title_elementset = '$this->from_title_elementset' AND
    LTI.from_title_element_id = $this->from_title_element_id";
    $results = get_db()->getTable('linktoitem')->fetchObject($requete);
    if (!is_null($results)) {
      $this->addError('Error', __('There is already a link on this element.'));
      return;
    }
  }

  public function delete() {
    if (is_null($this->id) || $this->id == "0" ) return false;
    else {
      $db = get_db();
      $sql = "delete from {$this->_db->linktoitem} where id = ".$this->id;
      $result = $db->query($sql);
    }
  }
}
