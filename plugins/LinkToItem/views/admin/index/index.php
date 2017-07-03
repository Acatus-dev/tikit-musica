<?php
$head = array('title' => __('Link to item'));
echo head($head);
?>

<?php echo flash(); ?>

<form method="post" action="<?php echo admin_url('link-to-item/index/add/'); ?>">
  <h2>Create a new link</h2>
  <section class="seven columns alpha">
    <div class="field">
      <div class="seven columns alpha">
        <p class="explanation">Create a link on this element :</p>
      </div>

      <div class="two columns alpha">
        <select name="collection1">
          <option value="0">--- Collection</option>
          <?php foreach($collections as $id=>$name) { echo '<option value="'.$id.'">'.$name.'</option>'; } ?>
        </select>
      </div>
      <div class="two columns">
        <select name="itemtype1">
          <option value="0">--- Item type</option>
          <?php foreach($itemtypes as $id=>$name) { echo '<option value="'.$id.'">'.$name.'</option>'; } ?>
        </select>
      </div>
      <div class="three columns omega">
        <select name="elementtitre1">
          <option value="0">--- Element</option>
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
        <p class="explanation">using as id</p>
      </div>
      <div class="three columns omega">
        <select name="identifiant1">
          <option value="0">--- Element</option>
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
        <p class="explanation">to link to item with id :</p>
      </div>

      <div class="two columns alpha">
        <select name="collection2">
          <option value="0">--- Collection</option>
          <?php foreach($collections as $id=>$name) { echo '<option value="'.$id.'">'.$name.'</option>'; } ?>
        </select>
      </div>
      <div class="two columns">
        <select name="itemtype2">
          <option value="0">--- Item type</option>
          <?php foreach($itemtypes as $id=>$name) { echo '<option value="'.$id.'">'.$name.'</option>'; } ?>
        </select>
      </div>
      <div class="three columns omega">
        <select name="identifiant2">
          <option value="0">--- Element</option>
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
    </div>
  </section>
  <section class="panel three columns omega">
      <?php echo $this->csrf;?>
      <input value="Add new link" class="submit big green button" type="submit" name="submit-button">
  </section>
</form>



<?php // Tableau des liens existants ?>
<section class="ten columns alpha">
  <h2>Existing links</h2>
  <?php if (!empty($links_to_item)) { ?>
    <table>
      <thead>
          <tr>
              <th colspan="2">Link on element</th>
              <th>Linked element</th>
              <th>Delete</th>
          </tr>
      </thead>
      <tbody>
          <?php
     foreach($links_to_item as $link) { ?>
            <tr>
              <td><b>Collection</b> : <?php echo $link->getFromCollectionName() ?><br />
                  <b>Item Type</b> : <?php echo $link->getFromItemTypeName() ?><br />
                  <b>Element</b> : <?php echo $link->getFromElementNameTitle()." (".$link->from_title_elementset.")" ?><br />
                  <b>with id</b> <?php echo $link->getFromElementName()." (".$link->from_elementset.")" ?></td>
            <td>=></td>
            <td><b>Collection</b> : <?php echo $link->getToCollectionName() ?><br />
            <b>Item Type</b> : <?php echo $link->getToItemTypeName() ?><br />
            <b>Element</b> : <?php echo $link->getToElementName()." (".$link->to_elementset.")" ?></td>
            <td>
            <form method="post"  action="<?php echo admin_url('link-to-item/index/delete/id/').$link->id; ?>">
              <?php echo $this->csrf;?>
              <input type="hidden" name="link_id" value="<?php echo $link->id;?>" />
              <input value="Delete"  type="submit" name="delete-button" id="admin-link-delete-<?php echo $link->id; ?>">
            </form>
            <!--<a class="edit" href="<?php echo admin_url('link-to-item/index/delete/id/').$link->id ?>"><button>Delete</button></a>--></td>
        </tr>
      <?php }; ?>
      </tbody>
    </table>
    <?php } else { ?>
      No link have been recorded yet.
    <?php } ?>
</section>

<?php echo foot(); ?>



          