<?php
define('EDITIONKIT_THEME_FILES_PATH', BASE_DIR.'/files/theme/'); 
define('EDITIONKIT_THEME_FILES_PATH_SHORT', '/files/theme/'); 

function replaceUrl($text)
{
    $pattern = "#(?<!\")((?i)\b((?:[a-z][\w-]+:(?:/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'\".,<>?«»“”‘’])))#si";
    
    $text = preg_replace($pattern, '<a target="_blank" href="$0">$0</a>', $text);
    return $text;
}

function getHomePages()
{
    $pages = array(
        'about',
        'home'
    );
    $results = array();
    foreach ($pages as $page)
    {
        $result = get_db()->getTable('SimplePagesPage')->findBy(array(
            'slug' => $page
        ));
        if (count($result) > 0)
        {
            $results[] = $result[0];
        }
    }
    
    return $results;
}

function truncate($html, $limit)
{
    $truncator = new TruncateHTML();
    
    return $truncator->truncateChars($html, $limit);
}

/**
 * Returns a breadcrumb for a given page.
 *
 * @uses public_url(), html_escape()
 * @param integer|null The id of the page.  If null, it uses the current simple page.
 * @param string $separator The string used to separate each section of the breadcrumb.
 * @param boolean $includePage Whether to include the title of the current page.
 */
function page_breadcrumbs($pageId = null, $seperator = ' > ')
{
    $items = array();
    
    if ($pageId === null)
    {
        $page = get_current_record('simple_pages_page', false);
    }
    else
    {
        $page = get_db()->getTable('SimplePagesPage')->find($pageId);
    }
    
    if ($page)
    {
        $ancestorPages = get_db()->getTable('SimplePagesPage')->findAncestorPages($page->id);
        $bPages = array_merge(array(
            $page
        ), $ancestorPages);
        
        // make sure all of the ancestors and the current page are published
        foreach ($bPages as $bPage)
        {
            if (!$bPage->is_published)
            {
                $items = array();
                return $items;
            }
        }
        
        $items = array_reverse($bPages);
    }
    return $items;
}
