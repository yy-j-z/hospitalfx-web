$ErrorActionPreference = "Stop"

$source = 'C:\Users\jyy\Downloads\hospitaFXjyy\business-plan-user-source.docx'
$target = 'C:\Users\jyy\Downloads\hospitaFXjyy\business-plan-user-formatted-v2.docx'

$word = New-Object -ComObject Word.Application
$word.Visible = $false

try {
    $doc = $word.Documents.Open($source)

    $coverText = @"
第十五届“挑战杯”全国大学生创业计划竞赛
主赛道 新医科类 创意组

蓉城医枢
智慧门诊协同系统商业计划书
HospitalFX Business Plan
面向中小型医疗机构的患者服务、门诊接诊、药房协同与 AI 辅助一体化解决方案

"@

    $range = $doc.Range(0, 0)
    $range.InsertBefore($coverText)

    $styleSpecs = @(
        @{ Index = 1; Font = '宋体'; Size = 16; Bold = 1; Align = 1; SpaceAfter = 6 },
        @{ Index = 2; Font = '宋体'; Size = 14; Bold = 0; Align = 1; SpaceAfter = 18 },
        @{ Index = 4; Font = '黑体'; Size = 28; Bold = 1; Align = 1; SpaceAfter = 10 },
        @{ Index = 5; Font = '黑体'; Size = 18; Bold = 0; Align = 1; SpaceAfter = 6 },
        @{ Index = 6; Font = 'Times New Roman'; Size = 12; Bold = 0; Align = 1; SpaceAfter = 10 },
        @{ Index = 7; Font = '宋体'; Size = 12; Bold = 0; Align = 1; SpaceAfter = 12 }
    )

    foreach ($spec in $styleSpecs) {
        $p = $doc.Paragraphs.Item($spec.Index).Range
        $p.Font.Name = $spec.Font
        $p.Font.Size = $spec.Size
        $p.Font.Bold = $spec.Bold
        $p.ParagraphFormat.Alignment = $spec.Align
        $p.ParagraphFormat.SpaceAfter = $spec.SpaceAfter
    }

    $tableAnchor = $doc.Paragraphs.Item(8).Range
    $tableAnchor.Collapse(0)
    $table = $doc.Tables.Add($tableAnchor, 6, 2)
    $table.Borders.Enable = 1
    $table.Range.Font.Name = '宋体'
    $table.Range.Font.Size = 12
    $table.Columns.Item(1).Width = $word.CentimetersToPoints(3.8)
    $table.Columns.Item(2).Width = $word.CentimetersToPoints(10.6)

    $rows = @(
        @('参赛学校', '四川师范大学'),
        @('项目负责人', '蓋盈盈'),
        @('团队成员', '蓋盈盈、陶思源、毕晨曦、赵爽、任杨桐'),
        @('项目分工', '蓋盈盈、陶思源负责 Web 前后端开发；毕晨曦负责答辩；赵爽负责 PPT 设计和文字工作；任杨桐负责资料采集；毕晨曦与任杨桐共同负责社会调研'),
        @('指导老师', '待补充'),
        @('完成时间', '2026年5月')
    )

    for ($i = 1; $i -le 6; $i++) {
        $table.Cell($i, 1).Range.Text = $rows[$i - 1][0]
        $table.Cell($i, 2).Range.Text = $rows[$i - 1][1]
        $table.Cell($i, 1).Range.ParagraphFormat.Alignment = 1
        $table.Cell($i, 2).Range.ParagraphFormat.Alignment = 0
        $table.Cell($i, 1).VerticalAlignment = 1
        $table.Cell($i, 2).VerticalAlignment = 1
    }

    $afterTable = $table.Range
    $afterTable.Collapse(0)
    $afterTable.InsertParagraphAfter()
    $afterTable.InsertAfter("`r四川师范大学`r创新创业项目申报材料`r")

    $doc.Paragraphs.Item(9).Range.Font.Name = '宋体'
    $doc.Paragraphs.Item(9).Range.Font.Size = 14
    $doc.Paragraphs.Item(9).Range.ParagraphFormat.Alignment = 1
    $doc.Paragraphs.Item(10).Range.Font.Name = '宋体'
    $doc.Paragraphs.Item(10).Range.Font.Size = 14
    $doc.Paragraphs.Item(10).Range.ParagraphFormat.Alignment = 1

    $coverEnd = $doc.Paragraphs.Item(11).Range
    $coverEnd.Collapse(0)
    $coverEnd.InsertBreak(7)

    foreach ($p in $doc.Paragraphs) {
        $text = $p.Range.Text.Trim()
        if ($text -eq '蓉城医枢智慧门诊协同系统商业计划书') {
            $p.Range.Font.Name = '黑体'
            $p.Range.Font.Size = 20
            $p.Range.Font.Bold = 1
            $p.Alignment = 1
            $p.SpaceAfter = 12
        }
        elseif ($text -match '^[一二三四五六七八九十]+、') {
            $p.Range.Font.Name = '黑体'
            $p.Range.Font.Size = 16
            $p.Range.Font.Bold = 1
            $p.SpaceBefore = 12
            $p.SpaceAfter = 6
        }
        elseif ($text -match '^\d+\.\d+') {
            $p.Range.Font.Name = '黑体'
            $p.Range.Font.Size = 13
            $p.Range.Font.Bold = 1
            $p.SpaceBefore = 6
            $p.SpaceAfter = 3
        }
        elseif ($text.Length -gt 0) {
            $p.Range.Font.Name = '宋体'
            $p.Range.Font.Size = 12
            $p.Range.Font.Bold = 0
            $p.Format.FirstLineIndent = $word.CentimetersToPoints(0.74)
            $p.Format.SpaceAfter = 0
        }
    }

    $doc.SaveAs([ref] $target, [ref] 16)
    $doc.Close()
}
finally {
    $word.Quit()
}

Get-Item $target | Select-Object FullName, Length, LastWriteTime
