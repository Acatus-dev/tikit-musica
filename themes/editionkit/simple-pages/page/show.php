<?php $bodyclass = 'page simple-page';
if ($is_home_page):
    $bodyclass .= ' simple-page-home';
endif;

echo head(array(
    'title' => metadata('simple_pages_page', 'title'),
    'bodyclass' => $bodyclass,
    'bodyid' => metadata('simple_pages_page', 'slug')
));

$customTpl = dirname(__FILE__) . "/custom/" . metadata('simple_pages_page', 'slug') . ".php";
?>

<nav id="breadcrumb" class="breadcrumb">
    <ul>
        <li>
            <a href="<?php echo public_url(''); ?>" title="Go to <?php echo __('Home'); ?>">
                <?php echo __('Home'); ?>
            </a>
        </li>
        <?php $items = page_breadcrumbs(); $i = 1; $len = count($items); ?>
        <?php foreach($items as $item) : ?>
            <li>
                <?php if($i < $len) : ?>
                    <a href="<?php echo public_url($item->slug); ?>" title="Go to <?php echo $item->title ?>">
                        <?php echo $item->title; ?>
                    </a>
                <?php else : ?>
                    <?php echo $item->title; ?>
                <?php endif; ?>
            </li>
            <?php $i++; ?>
        <?php endforeach; ?>
    </ul>
</nav>

<?php if(file_exists($customTpl)) : ?>
    <?php include($customTpl); ?> 
<?php else : ?>
    <div id="primary">
        <h1><?php echo metadata('simple_pages_page', 'title'); ?></h1>
        <div class="content">
        <?php
        $text = metadata('simple_pages_page', 'text', array('no_escape' => true));
        echo $this->shortcodes($text);
        ?>
        </div>
    </div>
<?php endif; ?>
<?php echo foot(); ?>