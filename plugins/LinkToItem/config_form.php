<div class='field'>
  <h2>Créer un nouveau lien</h2>
  <div class="seven columns alpha">
    <p class="explanation">Créer un lien sur cet élément :</p>
  </div>

  <div class="two columns alpha">
    <select name="collection1">
      <option value="0">--- Collection</option>
      <?php foreach($collections as $id=>$name) { echo '<option value="'.$id.'">'.$name.'</option>'; } ?>
    </select>
  </div>
  <div class="two columns">
    <select name="itemtype1">
      <option value="0">--- Type d'item</option>
      <?php foreach($itemtypes as $id=>$name) { echo '<option value="'.$id.'">'.$name.'</option>'; } ?>
    </select>
  </div>
  <div class="three columns omega">
    <select name="elementtitre1">
      <option value="0">--- Sélectionner un élément</option>
    <?php
      $current_element_set = null;
      foreach ($elements as $element) {
          if ($element->set_name != $current_element_set) {
              $current_element_set = $element->set_name;
          }
          echo '<option value="'.$current_element_set.",".$element->id.'">'.$current_element_set." - ".$element->name.'</option>';
      }
    ?>
    </select>
  </div>

  <div class="four columns alpha">
    <p class="explanation">en utilisant l'identifiant</p>
  </div>
  <div class="three columns omega">
    <select name="identifiant1">
      <option value="0">--- Sélectionner un élément</option>
      <?php
        $current_element_set = null;
        foreach ($elements as $element) {
            if ($element->set_name != $current_element_set) {
                $current_element_set = $element->set_name;
            }
            echo '<option value="'.$current_element_set.",".$element->id.'">'.$current_element_set." - ".$element->name.'</option>';
        }
      ?>
    </select>
  </div>

  <div class="seven columns alpha">
    <p class="explanation">pour relier à l'item portant l'identifiant :</p>
  </div>

  <div class="two columns alpha">
    <select name="collection2">
      <option value="0">--- Collection</option>
      <?php foreach($collections as $id=>$name) { echo '<option value="'.$id.'">'.$name.'</option>'; } ?>
    </select>
  </div>
  <div class="two columns">
    <select name="itemtype2">
      <option value="0">--- Type d'item</option>
      <?php foreach($itemtypes as $id=>$name) { echo '<option value="'.$id.'">'.$name.'</option>'; } ?>
    </select>
  </div>
  <div class="three columns omega">
    <select name="identifiant2">
      <option value="0">--- Sélectionner un élément</option>
      <?php
        $current_element_set = null;
        foreach ($elements as $element) {
            if ($element->set_name != $current_element_set) {
                $current_element_set = $element->set_name;
            }
            echo '<option value="'.$current_element_set.",".$element->id.'">'.$current_element_set." - ".$element->name.'</option>';
        }
      ?>
    </select>
  </div>



  <h2>Liens existants</h2>
  <table>
    <thead>
        <tr>
            <th colspan="2">Lien sur l'élément</th>
            <th>Élément référencé</th>
            <th>Suppr.</th>
        </tr>
    </thead>
    <tbody>
        <?php
   foreach($links_to_item as $link) {
        echo "<tr>
          <td>".$link->getFromCollectionName()." - ".$link->getFromItemTypeName()." - ".$link->getFromElementNameTitle()." (".$link->from_title_elementset.") via ".$link->getFromElementName()." (".$link->from_elementset.")</td>
          <td>=></td>
          <td>".$link->getToCollectionName()." - ".$link->getToItemTypeName()." - ".$link->getToElementName()." (".$link->to_elementset.")</td>
          <td>[X]</td>
      </tr>";
    }; ?>
    </tbody>
  </table>
</div>
